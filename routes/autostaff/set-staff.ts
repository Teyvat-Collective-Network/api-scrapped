import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /set-staff/:guild"({ params: { guild }, body }) {
        if (!(await hasGuild(guild))) throw 404;

        await query(`DELETE FROM guild_roles WHERE guild = ?`, [guild]);
        await query(`DELETE FROM guild_staff WHERE guild = ?`, [guild]);

        const users: Record<string, string[]> = body.users;

        const roles = Object.entries(users).flatMap(([user, roles]) => roles.map((role) => [user, guild, role]));
        const staff = Object.keys(users).map((user) => [user, guild]);

        await query(`INSERT INTO users VALUES ? ON DUPLICATE KEY UPDATE id = id`, [Object.keys(users).map((id) => [id, false])]);

        if (roles.length > 0) await query(`INSERT INTO guild_roles VALUES ?`, [roles]);
        if (staff.length > 0) await query(`INSERT INTO guild_staff VALUES ?`, [staff]);
    },
} as RouteMap;
