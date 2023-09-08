import { get_user } from "../utils.js";

export default function (server, _, done) {
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
        return request.headers.authorization;
    });

    server.api("GET /auth/me", async (request) => {
        return await get_user(request.user.id);
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
