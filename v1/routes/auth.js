import crypto from "crypto";
import oauth from "../lib/oauth.js";

export default function (server, _, done) {
    server.api("GET /auth/login", async (request, reply) => {
        const state = crypto.randomBytes(32).toString("hex");
        request.session.state = state;
        request.session.redirect = request.query.redirect || process.env.DEFAULT_REDIRECT;

        return reply.redirect(
            `https://discord.com/oauth2/authorize?${new URLSearchParams({
                response_type: "code",
                client_id: process.env.DISCORD_ID,
                scope: "identify",
                redirect_uri: process.env.AUTH_REDIRECT,
                state,
            })}`,
        );
    });

    server.api("GET /auth/callback", async (request, reply) => {
        const { state, redirect } = request.session;
        await request.session.destroy();

        if (!state || state !== request.query.state) throw [401, "Invalid state."];

        const tokens = await oauth.token({
            client_id: process.env.DISCORD_ID,
            client_secret: process.env.DISCORD_SECRET,
            code: request.query.code,
            redirect_uri: process.env.AUTH_REDIRECT,
        });

        if (!tokens) throw [401, "Invalid code."];

        const user = await oauth.user(tokens).catch((error) => server.logger.error(error));
        if (!user) throw [401, "Invalid token received."];

        const now = Date.now();
        const expires = now + 30 * 24 * 60 * 60 * 1000;

        const token = server.jwt.sign({ id: user.id, created: now, expires });
        reply.setCookie("token", token, { sameSite: "lax", domain: process.env.COOKIE_DOMAIN, expires });
        return reply.redirect(redirect || process.env.DEFAULT_REDIRECT);
    });

    server.api("GET /auth/key-info", async (request) => {
        const { user } = request;

        return {
            id: user.id,
            expiresAt: user.expires || null,
            expiresIn: user.expires ? user.expires - Date.now() : null,
            scopes: user.scopes ?? null,
        };
    });

    server.api("GET /auth/token", async (request) => {
        return request.headers.authorization || request.cookies.token;
    });

    server.api("POST /auth/logout", async (_, reply) => {
        reply.clearCookie("token", { sameSite: "lax", domain: process.env.COOKIE_DOMAIN });
    });

    server.api("POST /auth/invalidate", async (request) => {
        const now = new Date();
        await server.query(`INSERT INTO invalidations VALUES (?, ?) ON DUPLICATE KEY UPDATE invalidated = ?`, [request.user.id, now, now]);
    });

    server.api("POST /auth/key", async (request) => {
        const now = Date.now();
        const data = { id: request.user.id, created: now };

        const { maxage, scopes } = request.body;

        if (maxage) data.expires = now + maxage;

        if (scopes) data.scopes = scopes.map((scope) => scope.trim());
        else data.scopes = ["all"];

        return server.jwt.sign(data);
    });

    done();
}
