import codes from "../../lib/codes.ts";
import { getRole, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /roles/:roleId"({ params: { roleId }, body, user }) {
        if (!user.observer) throw 403;

        if (!(await hasRole(roleId))) throw [404, codes.MISSING_ROLE, `No role exists with ID ${roleId}.`];

        const set = [];
        const values = [];

        for (const key of ["description"]) {
            const value = body[key];
            if (value === undefined) continue;

            set.push(`${key} = ?`);
            values.push(value);
        }

        if (set.length > 0) await query(`UPDATE roles SET ${set.join(", ")} WHERE id = ?`, [...values, roleId]);

        return await getRole(roleId);
    },
} as RouteMap;
