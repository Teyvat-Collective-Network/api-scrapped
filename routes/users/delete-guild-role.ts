import { getRole, getUser, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../types.ts";

export default {
    async "* DELETE /users/:userId/roles/:roleId/:guildId"({ params: { userId, roleId, guildId }, user }) {
        if (!user.observer && !user.guilds[guildId]?.owner) throw 403;

        const role = await getRole(roleId);
        if (!role || (role.assignment !== "guild" && role.assignment !== "all")) throw 400;
        if (!(await hasGuild(guildId))) throw 400;

        await query(`DELETE FROM guild_roles WHERE user = ? AND guild = ? AND role = ?`, [userId, guildId, roleId]);

        return await getUser(userId);
    },
} as RouteMap;
