import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /autostaff/:guild/:watch"({ params: { guild, watch } }) {
        if (!(await hasGuild(guild))) throw 404;
        await query(`INSERT INTO autostaff VALUES (?) ON DUPLICATE KEY UPDATE guild = guild`, [[guild, watch]]);
    },
} as RouteMap;
