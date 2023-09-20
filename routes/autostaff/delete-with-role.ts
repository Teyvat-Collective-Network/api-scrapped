import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /autostaff/:guild/:watch/:role"({ params: { guild, watch, role } }) {
        if (!(await hasGuild(guild))) throw 404;
        await query(`DELETE FROM autostaff_roles WHERE watch = ? AND role = ?`, [watch, role]);
    },
} as RouteMap;
