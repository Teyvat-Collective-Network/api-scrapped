import codes from "../../lib/codes.ts";
import { getRole, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /roles/:roleId"({ params: { roleId }, user }) {
        if (!user.observer) throw 403;

        if (!(await hasRole(roleId))) throw [404, codes.MISSING_ROLE, `No role exists with ID ${roleId}`];
        if ((await getRole(roleId)).assignment === "pseudo") throw [400, codes.INVALID_ROLE_TYPE, "Pseudo roles cannot be deleted"];

        await query(`DELETE FROM roles WHERE id = ?`, roleId);
    },
} as RouteMap;
