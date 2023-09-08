import "dotenv/config.js";

import fastify from "fastify";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import session from "@fastify/session";

import JWT from "./lib/jwt.js";
import TimedStore from "./lib/timed-store.js";

import logger from "../logger.js";
import query from "./db/query.js";

import "./db/setup.js";
import scopecheck from "./lib/scopecheck.js";
import routes from "./routes.js";
import auth from "./routes/auth.js";
import { get_user } from "./utils.js";

const server = fastify({ ignoreTrailingSlash: true, ajv: { customOptions: { removeAdditional: true, coerceTypes: false } } });

server.decorate("query", query);
server.decorate("logger", logger);
server.decorate("jwt", new JWT(process.env.JWT_SECRET));

server.decorate("api", function (route, handler) {
    const data = routes[route];
    if (!data) throw new Error(`Missing route declaration for ${route}.`);

    const [method, path] = route.split(" ");
    server[method.toLowerCase()](`/v1${path}`, { schema: data.schema ?? {} }, async (request, reply) => {
        if (await scopecheck(request, data.scope))
            try {
                if (data.auth) if (!(request.user = await request.auth())) throw 401;
                return await handler(request, reply);
            } catch (error) {
                if (typeof error === "number") return reply.code(error).send();

                if (Array.isArray(error) && error.length === 2) {
                    const [code, message] = error;
                    if (typeof code === "number" && typeof message === "string") return reply.code(code).send(message);
                }

                throw error;
            }
        else return reply.code(401).send();
    });
});

server.decorateRequest("auth", async function () {
    const payload = server.jwt.verify(this.headers.authorization);

    if (!payload || !payload.created || payload.expires < Date.now()) return;

    const invalidation = (await query("SELECT invalidated FROM invalidations WHERE id = ?", [payload.id]))[0];

    if (invalidation && payload.created < invalidation.invalidated.getTime()) return;

    return { ...(await get_user(payload.id)), ...payload };
});

server.decorateRequest("access", async function (f) {
    const user = await this.auth();
    return user && (await f(user));
});

server.decorateRequest("admin", async function () {
    return await this.access((u) => u.roles.includes(process.env.ADMIN_ROLE));
});

server.register(cookie);
server.register(cors);
server.register(formbody);
server.register(session, {
    secret: process.env.SESSION_SECRET,
    store: new TimedStore(5 * 60 * 1000),
    cookie: { secure: !!process.env.PRODUCTION },
    saveUninitialized: false,
});

server.register(auth);

server.listen({ port: process.env.PORT }).then(() => logger.info("[API] READY"));
