import query from "../../lib/query.js";
import { RouteMap } from "../../types.js";

export default {
    async "* POST /auth/invalidate"({ user }) {
        const now = Date.now();
        await query(`INSERT INTO invalidations VALUES (?, ?) ON DUPLICATE KEY UPDATE invalidated = ?`, [user.id, now, now]);
    },
} as RouteMap;
