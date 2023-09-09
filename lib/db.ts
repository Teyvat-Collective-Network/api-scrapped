import { Role, User } from "../types.ts";
import query from "./query.ts";
import { addToSet } from "./utils.ts";

const defaultGuild = { owner: false, advisor: false, voter: false, staff: false, roles: [] };

export async function getUser(id: string): Promise<User> {
    const user: User = { id, guilds: {}, roles: [], observer: false, owner: false, advisor: false, voter: false, council: false, staff: false };

    const [item] = await query(`SELECT observer FROM users WHERE id = ?`, [id]);

    if (item?.observer) {
        user.observer = true;
        addToSet(user.roles, "observer");
    }

    for (const { guild } of await query(`SELECT guild FROM guild_staff WHERE user = ?`, [id])) {
        const object = (user.guilds[guild] ??= defaultGuild);
        object.staff = true;
        addToSet(object.roles, "staff");
    }

    for (const { guild, role } of await query(`SELECT guild, role FROM guild_roles WHERE user = ?`, [id])) {
        const object = (user.guilds[guild] ??= defaultGuild);
        addToSet(object.roles, role);
    }

    for (const { role } of await query(`SELECT role FROM global_roles WHERE user = ?`, [id])) {
        user.roles.push(role);
    }

    for (const role of ["owner", "advisor"] as const)
        for (const { id: guild, delegated } of await query(`SELECT id, delegated FROM guilds WHERE ${role} = ?`, [id])) {
            addToSet(user.roles, role);

            const object = (user.guilds[guild] ??= defaultGuild);

            addToSet(object.roles, role);
            object[role] = true;

            addToSet(object.roles, "staff");
            object.staff = true;

            for (const item of [role, "staff"] as const) {
                addToSet(user.roles, item);
                user[item] = true;
            }

            if ((role === "advisor") === !!delegated) {
                addToSet(object.roles, "voter");
                object.voter = true;

                addToSet(user.roles, "voter");
                user.voter = true;
            }
        }

    user.council = user.observer || user.owner || user.voter;

    return user;
}

export async function getRole(id: string): Promise<Role | null> {
    const [role] = await query(`SELECT * FROM roles WHERE id = ?`, [id]);
    return role;
}

export async function hasGuild(id: string): Promise<boolean> {
    const guilds = await query(`SELECT 1 FROM guilds WHERE id = ?`, [id]);
    return guilds.length > 0;
}
