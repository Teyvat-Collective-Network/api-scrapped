import codes from "../../lib/codes.ts";
import { ensureUser, getUser, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /staff/:guildId/:userId"({ params: { guildId, userId }, user }) {
        if (!user.observer && !user.guilds[guildId]?.owner) throw 403;

        if (!(await hasGuild(guildId))) throw [400, codes.MISSING_GUILD, `No guild exists with ID ${guildId}.`];

        await ensureUser(userId);
        await query(`INSERT INTO guild_staff VALUES (?) ON DUPLICATE KEY UPDATE user = user`, [[userId, guildId]]);

        return await getUser(userId);
    },
} as RouteMap;
