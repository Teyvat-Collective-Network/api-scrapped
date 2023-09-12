import codes from "../../lib/codes.ts";
import { getUser, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /staff/:guildId/:userId"({ params: { guildId, userId }, user }) {
        if (!user.observer && !user.guilds[guildId]?.owner) throw 403;

        if (!(await hasGuild(guildId))) throw [400, codes.MISSING_GUILD, `No guild exists with ID ${guildId}.`];

        await query(`DELETE FROM guild_staff WHERE user = ? AND guild = ?`, [userId, guildId]);

        return await getUser(userId);
    },
} as RouteMap;
