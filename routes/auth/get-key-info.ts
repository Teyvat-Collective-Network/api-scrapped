import { RouteMap } from "../../types.js";

export default {
    async "* GET /auth/key-info"({ user }) {
        return {
            id: user.id,
            expiresAt: user.expires || null,
            expiresIn: user.expires ? user.expires - Date.now() : null,
            scopes: user.scopes ?? null,
        };
    },
} as RouteMap;
