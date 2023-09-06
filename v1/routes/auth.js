import crypto from "crypto";
import HTTPErrors from "http-errors";
import oauth from "../lib/oauth.js";

export default function (server, _, done) {
    server.get("/", async (request, reply) => {
        if (!request.query.code) {
            const state = crypto.randomBytes(32).toString("hex");
            request.session.state = state;
            request.session.redirect = request.query.redirect || process.env.DEFAULT_REDIRECT;

            return reply.redirect(
                `https://discord.com/oauth2/authorize?${new URLSearchParams({
                    response_type: "code",
                    client_id: process.env.DISCORD_ID,
                    scope: "identify",
                    redirect_uri: `${process.env.DEFAULT_REDIRECT}/v1/auth`,
                    state,
                })}`,
            );
        }

        const { state, redirect } = request.session;
        await request.session.destroy();

        if (!state || state !== request.query.state) throw HTTPErrors[401]("Invalid State");

        const tokens = await oauth
            .token({
                client_id: process.env.DISCORD_ID,
                client_secret: process.env.DISCORD_SECRET,
                code: request.query.code,
                redirect_uri: `${process.env.DEFAULT_REDIRECT}/v1/auth`,
            })
            .catch(console.error);

        if (!tokens) throw HTTPErrors[401]("Invalid Code");

        const user = await oauth.user(tokens).catch(console.error);
        if (!user) throw HTTPErrors[401]("Invalid Token Received");

        const now = Date.now();
        const expires = now + 30 * 24 * 60 * 60 * 1000;

        const jwt = server.jwt.sign({ id: user.id, created: now, expires });
        reply.setCookie("token", jwt, { sameSite: "lax", domain: process.env.COOKIE_DOMAIN, expires });
        return reply.redirect(redirect || process.env.DEFAULT_REDIRECT);
    });

    server.get("/keyinfo", async (request, reply) => {
        const user = await request.auth();
        if (!user) return reply.code(401).send();

        return reply.send({
            id: user.id,
            expiresAt: user.expires || null,
            expiresIn: user.expires ? user.expires - Date.now() : null,
            scopes: user.scopes ?? ["all"],
        });
    });

    server.get("/token", async (request, reply) => {
        const user = await request.auth();
        if (!user) return reply.code(401).send();
        return reply.send({ id: user.id, token: request.headers.authorization || request.cookies.token });
    });

    server.post("/key", async (request, reply) => {
        const user = await request.auth();
        if (!user) return reply.code(401).send();

        const now = Date.now();
        const data = { id: user.id, created: now };

        let expires;

        if (request.query.maxage) {
            const maxage = parseInt(request.query.maxage);
            if (isNaN(maxage) || maxage <= 0) return reply.code(400).send("maxage should be a positive integer");

            expires = now + maxage;
        }

        if (request.query.expires) {
            const expiry = parseInt(request.query.expires);
            if (isNaN(expiry) || expiry <= now) return reply.code(400).send("expiry should be an integer representing a timestamp in the future");

            if (expires) expires = Math.min(expires, parseInt(expiry));
            else expires = expiry;
        }

        if (expires) data.expires = expires;

        if (request.query.scopes) data.scopes = request.query.scopes.split(",").map((x) => x.trim());
        else data.scopes = ["all"];

        return server.jwt.sign(data);
    });

    server.post("/invalidate", async (request, reply) => {
        const user = await request.auth();
        if (!user) return reply.code(401).send();
        await server.db.invalidations.updateOne({ id: user.id }, { $set: { invalidated: new Date() } }, { upsert: true });
        return reply.code(202).send();
    });

    server.post("/logout", async (_, reply) => {
        reply.clearCookie("token", { sameSite: "lax", domain: process.env.COOKIE_DOMAIN });
        return reply.code(202).send();
    });

    done();
}
