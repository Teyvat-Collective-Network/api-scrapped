import { getRole, hasGuild, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /autostaff/:guild/:watch/:role"({ params: { guild, watch, role } }) {
        if (!(await hasGuild(guild))) throw 404;
        if (!(await hasRole(role))) throw [404, -1, `No role with ID \`${role}\` exists.`];
        if (!["guild", "all"].includes((await getRole(role)).assignment)) throw [400, -1, `The \`${role}\` role cannot be assigned per guild.`];

        await query(`INSERT INTO autostaff VALUES (?) ON DUPLICATE KEY UPDATE guild = guild`, [[guild, watch]]);
        await query(`INSERT INTO autostaff_roles VALUES (?) ON DUPLICATE KEY UPDATE watch = watch`, [[watch, role]]);
    },
} as RouteMap;
