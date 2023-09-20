import codes from "../../lib/codes.ts";
import { hasGuild } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /guilds/:guildId"({ params: { guildId }, user }) {
        if (!user.observer) throw 403;

        if (!(await hasGuild(guildId))) throw [404, codes.MISSING_GUILD, `No guild exists with ID ${guildId}.`];

        await query(`DELETE FROM guilds WHERE id = ?`, [guildId]);
        await query(`DELETE FROM autoroles WHERE guild = ?`, [guildId]);
        await query(`DELETE FROM guild_autoroles WHERE guild = ?`, [guildId]);

        di(`PUT /autoroles`).catch(() => {});
    },
} as RouteMap;
