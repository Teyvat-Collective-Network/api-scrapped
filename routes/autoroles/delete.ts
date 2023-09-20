import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /autoroles/:guild/:role/:target"({ params: { guild, role, target } }) {
        await query(`DELETE FROM autoroles WHERE guild = ? AND role = ? AND target = ?`, [[guild, role, target]]);
    },
} as RouteMap;
