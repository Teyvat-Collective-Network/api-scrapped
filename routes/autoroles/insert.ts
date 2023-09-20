import { hasGuild, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /autoroles/:guild/:role/:target"({ params: { guild, role, target } }) {
        if (!hasRole(role)) throw [404, -1, `No role with ID \`${role}\` exists.`];

        await query(`INSERT INTO autoroles VALUES (?) ON DUPLICATE KEY UPDATE guild = guild`, [[guild, role, target]]);
    },
} as RouteMap;
