import { getRole, getUser, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../types.ts";

export default {
    async "* PUT /users/:userId/roles/:roleId/:guildId"({ params: { userId, roleId, guildId }, user }) {
        if (!user.observer && !user.guilds[guildId]?.owner) throw 403;

        const role = await getRole(roleId);

        if (!role || (role.assignment !== "guild" && role.assignment !== "all")) throw 400;
        if (!(await hasGuild(guildId))) throw 400;

        await query(`INSERT INTO guild_roles VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user = user`, [userId, guildId, roleId]);

        return await getUser(userId);
    },
} as RouteMap;
