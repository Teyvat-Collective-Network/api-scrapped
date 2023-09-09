import fs from "fs";
import compile, { versions } from "./compile.ts";
import query from "./lib/query.ts";
import routes from "./routes.ts";
import { RouteMap, Routes, User, spec } from "./types.ts";

import "./lib/setup.ts";
import jwt from "./lib/jwt.ts";
import { getUser } from "./lib/db.ts";

const handlers: Routes = {};

async function load(path: string) {
    if (fs.statSync(path).isDirectory()) {
        for (const name of fs.readdirSync(path)) {
            await load(`${path}/${name}`);
        }
    } else {
        const { default: map } = await import(path);
        compile(map, handlers);
    }
}

load("./routes");

Bun.serve({
    development: !!Bun.env.DEBUG,
    async fetch(req) {
        const url = new URL(req.url);

        for (const version of versions)
            if (url.pathname.startsWith(`/${version}`)) {
                try {
                    const path = url.pathname.slice(version.length + 1);
                    let realpath: string | null = null;

                    const method = req.method.toUpperCase();

                    const options = routes[version][method];
                    if (!options) throw 404;

                    const pathlist = path.slice(1).split("/");

                    let route: spec | null = null;
                    let params: any = {};

                    for (const [key, test] of Object.entries(options)) {
                        const elements = key.slice(1).split("/");
                        if (elements.length !== pathlist.length) continue;

                        let match = true;

                        for (let index = 0; index < elements.length; index++) {
                            const element = elements[index];
                            const item = pathlist[index];

                            if (element.startsWith(":")) {
                                params[element.slice(1)] = item;
                            } else if (element !== item) {
                                match = false;
                                break;
                            }
                        }

                        if (!match) continue;
                        if (test.schema?.params?.(params) === false) continue;

                        route = test;
                        realpath = key;
                        break;
                    }

                    if (!route) throw 404;

                    let user: User | undefined = undefined;

                    const token = req.headers.get("authorization");

                    if (token) {
                        const payload = jwt.verify(token);

                        if (payload?.created && (!payload.expires || payload.expires > Date.now())) {
                            const [invalidation] = await query(`SELECT invalidated FROM invalidations WHERE id = ?`, [payload.id]);

                            if (!invalidation || payload.created > invalidation.invalidated) {
                                if (payload.forge) user = payload.data;
                                else {
                                    const data = await getUser(payload.id);
                                    user = { ...payload, ...data };
                                }
                            }
                        }
                    }

                    if (route.auth && !user) throw [401, { error: "No authorization was provided." }];

                    if (route.scope) {
                        let { scope } = route;

                        if (user!.scopes && !user!.scopes.includes("all"))
                            while (true) {
                                if (user!.scopes.includes(scope)) break;
                                if (!scope.includes("/")) throw [403, { error: "Provided key does not have the required scope." }];
                                scope = scope.replace(/\/[^\/]*$/, "");
                            }
                    }

                    let body;

                    try {
                        body = await req.json();
                    } catch {
                        body = null;
                    }

                    if (route.schema?.body) {
                        if (!body) throw [400, { error: "No body provided." }];
                        if (!route.schema.body(body)) throw [400, route.schema.body.errors];
                    }

                    const handle = handlers[version][method]?.[realpath!];
                    if (!handle) throw 501;

                    const data = await handle({ req, params, body, user: user!, token: token! });

                    if (data instanceof Response) return data;
                    if (typeof data === "string") return new Response(data);
                    if (data === undefined) return new Response();
                    return new Response(JSON.stringify(data));
                } catch (error) {
                    if (typeof error === "number") return new Response("", { status: error });

                    if (Array.isArray(error) && error.length === 2) {
                        const [status, message] = error;
                        if (typeof status === "number") return new Response(typeof message === "string" ? message : JSON.stringify(message), { status });
                    }

                    throw error;
                }
            }

        return new Response("", { status: 404 });
    },
});
