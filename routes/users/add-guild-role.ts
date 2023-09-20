import codes from "../../lib/codes.ts";
import { ensureUser, getRole, getUser, hasGuild } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /users/:userId/roles/:roleId/:guildId"({ params: { userId, roleId, guildId }, user }) {
        if (!user.observer && !user.guilds[guildId]?.owner) throw 403;

        const role = await getRole(roleId);

        if (!role) throw [400, codes.MISSING_ROLE, "Role does not exist."];
        if (role.assignment !== "guild" && role.assignment !== "all") throw [400, codes.INVALID_ROLE_TYPE, "Invalid role."];
        if (!(await hasGuild(guildId))) throw [400, codes.MISSING_GUILD, "Guild does not exist."];

        await ensureUser(userId);
        await query(`INSERT INTO guild_roles VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user = user`, [userId, guildId, roleId]);

        di(`PUT /autoroles/${userId}`).catch(() => {});

        return await getUser(userId);
    },
} as RouteMap;
