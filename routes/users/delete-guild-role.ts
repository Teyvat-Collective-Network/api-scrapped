import codes from "../../lib/codes.ts";
import { ensureUser, getRole, getUser, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /users/:userId/roles/:roleId/:guildId"({ params: { userId, roleId, guildId }, user }) {
        if (!user.observer && !user.guilds[guildId]?.owner) throw 403;

        const role = await getRole(roleId);
        if (!role) throw [400, codes.MISSING_ROLE, "Role does not exist."];
        if (role.assignment !== "guild" && role.assignment !== "all") throw [400, codes.INVALID_ROLE_TYPE, "Invalid role."];
        if (!(await hasGuild(guildId))) throw [400, codes.MISSING_GUILD, "Guild does not exist."];

        await ensureUser(userId);
        await query(`DELETE FROM guild_roles WHERE user = ? AND guild = ? AND role = ?`, [userId, guildId, roleId]);

        return await getUser(userId);
    },
} as RouteMap;
