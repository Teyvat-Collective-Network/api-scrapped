import fs from "fs";
import compile, { versions } from "./compile.ts";
import query from "./lib/query.ts";
import { Routes, User, spec } from "./lib/types.ts";
import routes from "./routes.ts";

import codes from "./lib/codes.ts";
import { getUser } from "./lib/db.ts";
import jwt from "./lib/jwt.ts";
import logger from "./lib/logger.ts";
import "./lib/setup.ts";

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

        const log = (result: string, object?: any) => {
            const message = `[API] ${req.method} ${url.pathname}: ${result}`;

            if (object)
                if (JSON.stringify(object).match(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]/))
                    logger.trace({ censored: "Object may contain a token so it was censored." }, message);
                else logger.trace(object, message);
            else logger.trace(message);
        };

        for (const version of versions)
            if (url.pathname.startsWith(`/${version}`)) {
                try {
                    const path = url.pathname.slice(version.length + 1);
                    let realpath: string | null = null;

                    const method = req.method.toUpperCase();

                    const options = routes[version][method];
                    if (!options) throw [404, codes.NOT_FOUND, "Route not found."];

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

                    if (!route) throw [404, codes.NOT_FOUND, "Route not found."];

                    let user: User | undefined = undefined;

                    const token = req.headers.get("authorization");

                    if (token) {
                        const payload = jwt.verify(token);

                        if (payload?.created && (!payload.expires || payload.expires > Date.now())) {
                            const [invalidation] = await query(`SELECT invalidated FROM invalidations WHERE id = ?`, [payload.id]);

                            if (!invalidation || payload.created > invalidation.invalidated) {
                                if (payload.forge) {
                                    if (!Bun.env.DEBUG) {
                                        throw [403, codes.TEST_KEY, "The provided key is a test key."];
                                    }

                                    user = payload.data;
                                } else {
                                    const data = await getUser(payload.id);
                                    user = { ...payload, ...data };
                                }
                            }
                        }
                    }

                    if (route.auth && !user) throw [401, codes.MISSING_AUTH, "No authorization was provided."];

                    if (route.scope) {
                        let { scope } = route;

                        if (user!.scopes && !user!.scopes.includes("all"))
                            while (true) {
                                if (user!.scopes.includes(scope)) break;
                                if (!scope.includes("/")) throw [403, codes.MISSING_SCOPE, "Provided key does not have the required scope."];
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
                        if (!body) throw [400, codes.MISSING_BODY, "No body provided."];
                        if (!route.schema.body(body)) throw [400, codes.INVALID_BODY, { message: "Invalid body provided.", error: route.schema.body.errors }];
                    }

                    const handle = handlers[version][method]?.[realpath!];
                    if (!handle) throw [501, codes.NOT_IMPLEMENTED, "Not implemented."];

                    const data = await handle({ req, params, body, user: user!, token: token! });

                    if (data instanceof Response) {
                        log(`${data.status}`, await data.json());
                        return data;
                    }

                    if (typeof data === "string") {
                        log("200", { data });
                        return new Response(data);
                    }

                    if (data === undefined) {
                        log("200");
                        return new Response();
                    }

                    log("200", data);
                    return new Response(JSON.stringify(data));
                } catch (error) {
                    if (error === 403) error = [403, codes.FORBIDDEN, "Insufficient permissions."];

                    if (Array.isArray(error) && error.length === 3) {
                        const [status, code, object] = error;
                        const details = typeof object === "string" ? { message: object } : object;

                        if (typeof status === "number" && typeof code === "number") {
                            log(`${status} / ${code}`, details);
                            return new Response(JSON.stringify({ code, ...details }), { status });
                        }
                    }

                    logger.error(error);
                    return new Response(JSON.stringify({ code: 1, message: "Unexpected error." }), { status: 500 });
                }
            }

        return new Response(JSON.stringify({ code: codes.INVALID_VERSION, message: "Invalid API version." }), { status: 404 });
    },
});

logger.info("[API] READY");