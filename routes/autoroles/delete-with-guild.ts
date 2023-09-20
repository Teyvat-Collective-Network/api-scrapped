import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /guild-autoroles/:guild/:source/:target"({ params: { guild, source, target } }) {
        if (!hasGuild(source)) throw [404, -1, `No guild with ID \`${source}\` exists in the TCN.`];
        await query(`DELETE FROM guild_autoroles WHERE guild = ?, source = ?, target = ?`, [guild, source, target]);
    },
} as RouteMap;
