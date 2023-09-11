import codes from "../../lib/codes.ts";
import { getRole, hasRole } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /roles/:roleId"({ params: { roleId } }) {
        if (!(await hasRole(roleId))) throw [404, codes.MISSING_ROLE, `No role exists with ID ${roleId}`];
        return await getRole(roleId);
    },
} as RouteMap;
