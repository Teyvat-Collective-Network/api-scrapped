import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /guild-autoroles/:guild/:source/:target"({ params: { guild, source, target }, body }) {
        if (!hasGuild(source)) throw [404, -1, `No guild with ID \`${source}\` exists in the TCN.`];
        await query(`INSERT INTO guild_autoroles VALUES (?) ON DUPLICATE KEY UPDATE role = ?`, [[guild, source, target, body.role], body.role]);
    },
} as RouteMap;
