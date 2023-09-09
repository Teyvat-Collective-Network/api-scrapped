import { getRole, getUser } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../types.ts";

export default {
    async "* PUT /users/:userId/roles/:roleId"({ params: { userId, roleId }, user }) {
        if (!user.observer) throw 403;

        const role = await getRole(roleId);
        if (!role || (role.assignment !== "global" && role.assignment !== "all")) throw 400;

        await query(`INSERT INTO global_roles VALUES (?, ?) ON DUPLICATE KEY UPDATE user = user`, [userId, roleId]);

        return await getUser(userId);
    },
} as RouteMap;
