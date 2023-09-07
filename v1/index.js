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

const server = fastify({ ajv: { customOptions: { removeAdditional: true, coerceTypes: false } } });

server.decorate("query", query);
server.decorate("logger", logger);
server.decorate("jwt", new JWT(process.env.JWT_SECRET));

server.decorateRequest("auth", async function () {
    const payload = server.jwt.verify(this.headers.authorization || this.cookies.token);

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

server.get("/", async (_, reply) => {
    return reply.send("online");
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

server.listen({ port: process.env.PORT }).then(() => logger.info("[API] READY"));

server.register(auth, { prefix: "/v1/auth" });
server.register(utils, { prefix: "/v1" });
server.register(users, { prefix: "/v1/users" });

import "./db/setup.js";
import auth from "./routes/auth.js";
import utils from "./routes/utils.js";
import users from "./routes/users.js";
import { get_user } from "./utils.js";
