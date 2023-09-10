import { getUser } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /users/:userId"({ params: { userId }, body, user }) {
        if (!user.observer && "observer" in body) throw 403;
        await query(`INSERT INTO users VALUES (?, ?) ON DUPLICATE KEY UPDATE observer = ?`, [userId, body.observer, body.observer]);
        return await getUser(userId);
    },
} as RouteMap;
