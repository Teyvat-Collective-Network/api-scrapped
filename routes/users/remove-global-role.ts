import codes from "../../lib/codes.ts";
import { ensureUser, getRole, getUser } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /users/:userId/roles/:roleId"({ params: { userId, roleId }, user }) {
        if (!user.observer) throw 403;

        const role = await getRole(roleId);
        if (!role) throw [400, codes.MISSING_ROLE, "Role does not exist."];
        if (role.assignment !== "global" && role.assignment !== "all") throw [400, codes.INVALID_ROLE_TYPE, "Invalid role."];

        await ensureUser(userId);
        await query(`DELETE FROM global_roles WHERE user = ? AND role = ?`, [userId, roleId]);

        di(`PUT /autoroles/${userId}`).catch(() => {});

        return await getUser(userId);
    },
} as RouteMap;
