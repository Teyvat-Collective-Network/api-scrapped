import { getRole, getUser } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../types.ts";

export default {
    async "* DELETE /users/:userId/roles/:roleId"({ params: { userId, roleId }, user }) {
        if (!user.observer) throw 403;

        const role = await getRole(roleId);
        if (!role || (role.assignment !== "global" && role.assignment !== "all")) throw 400;

        await query(`DELETE FROM global_roles WHERE user = ? AND role = ?`, [userId, roleId]);

        return await getUser(userId);
    },
} as RouteMap;
