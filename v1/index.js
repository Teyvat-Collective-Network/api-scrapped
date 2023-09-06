import fastify from "fastify";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import session from "@fastify/session";

import "dotenv/config.js";
import Database from "./db/index.js";
import JWT from "./lib/jwt.js";
import auth from "./routes/auth.js";
import TimedStore from "./lib/timed-store.js";
import utils from "./routes/utils.js";
import users from "./routes/users.js";
import roles from "./routes/roles.js";

const server = fastify({ ajv: { customOptions: { removeAdditional: true, coerceTypes: false } } });

server.decorate("db", new Database(process.env.DATABASE_URI));
server.decorate("jwt", new JWT(process.env.JWT_SECRET));

server.decorateRequest("auth", async function () {
    const payload = server.jwt.verify(this.headers.authorization || this.cookies.token);

    if (!payload || !payload.created || payload.expiry > new Date().getTime()) return;

    const invalidation = (await server.db.invalidations.findOne({ id: payload.id }))?.toObject();
    if (invalidation && payload.created < invalidation.invalidated) return;

    const user = (await server.db.users.findOne({ id: payload.id }))?.toObject();
    return { ...(user ?? {}), ...payload };
});

server.decorateRequest("access", async function (f) {
    const user = await this.auth();
    return user && (await f(user));
});

server.decorateRequest("observer", async function () {
    return await this.access((u) => u.roles.includes("observer"));
});

server.addHook("preSerialization", async function removeMongoFields(request, reply, payload) {
    if (Array.isArray(payload)) return Promise.all(payload.map((item) => removeMongoFields(request, reply, item)));

    if (typeof payload === "object") {
        const copy = { ...payload };
        delete copy._id;
        delete copy.__v;
        return copy;
    }

    return payload;
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

server.register(utils, { prefix: "/v1" });
server.register(auth, { prefix: "/v1/auth" });
server.register(users, { prefix: "/v1/users" });
server.register(roles, { prefix: "/v1/roles" });

server.listen({ port: process.env.PORT }).then(() => console.log("API Ready."));
