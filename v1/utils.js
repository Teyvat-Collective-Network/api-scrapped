import query from "./db/query.js";

export const snowflake = { type: "string", pattern: "^\\d+$", minLength: 17, maxLength: 20 };

export async function get_user(id) {
    const user = { id, guilds: {}, roles: [] };

    for (const { guild, role } of await query(`SELECT guild, role FROM guild_roles WHERE user = ?`, [id])) {
        user.guilds[guild] ??= [];
        user.guilds[guild].push(role);
    }

    for (const { role } of await query(`SELECT role FROM global_roles WHERE user = ?`, [id])) user.roles.push(role);

    for (const role of ["owner", "advisor"])
        for (const { id: guild } of await query(`SELECT id FROM guilds WHERE ${role} = ?`, [id])) {
            if (!user.roles.includes(role)) user.roles.push(role);
            user.guilds[guild] ??= [];
            user.guilds[guild].push(role);
        }

    return user;
}
