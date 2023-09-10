import jwt from "../../lib/jwt.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* POST /auth/key"({ body, user }) {
        const now = Date.now();
        const data: { id: string; created: number; expires?: number; scopes: string[] } = { id: user.id, created: now, scopes: [] };

        const { maxage, scopes } = body;

        if (maxage) data.expires = now + maxage;
        data.scopes = scopes.map((scope: string) => scope.trim());

        return JSON.stringify(jwt.sign(data));
    },
} as RouteMap;
