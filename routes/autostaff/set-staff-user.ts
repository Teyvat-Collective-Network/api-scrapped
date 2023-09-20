import { ensureUser, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /set-staff/:guild/:user"({ params: { guild, user }, body }) {
        if (!(await hasGuild(guild))) throw 404;

        await ensureUser(user);

        await query(`DELETE FROM guild_roles WHERE guild = ? AND user = ?`, [guild, user]);

        if (body.staff) {
            await query(`INSERT INTO guild_staff VALUES (?) ON DUPLICATE KEY UPDATE user = user`, [[user, guild]]);

            const roles: string[] = body.roles;
            if (roles.length > 0) await query(`INSERT INTO guild_roles VALUES ?`, [roles.map((role) => [user, guild, role])]);
        } else await query(`DELETE FROM guild_staff WHERE guild = ? AND user = ?`, [guild, user]);
    },
} as RouteMap;
