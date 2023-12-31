import { getUser } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /users/:userId"({ params: { userId }, body, user }) {
        if (!user.observer && "observer" in body) throw 403;

        if ("observer" in body) await query(`INSERT INTO users VALUES (?, ?) ON DUPLICATE KEY UPDATE observer = ?`, [userId, body.observer, body.observer]);

        di(`PUT /autoroles/${userId}`).catch(() => {});

        return await getUser(userId);
    },
} as RouteMap;
