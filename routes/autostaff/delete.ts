import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /autostaff/:guild/:watch"({ params: { guild, watch } }) {
        if (!(await hasGuild(guild))) throw 404;
        await query(`DELETE FROM autostaff WHERE guild = ? AND watch = ?`, [guild, watch]);
    },
} as RouteMap;
