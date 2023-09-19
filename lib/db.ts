import query from "./query.ts";
import { Attribute, Banshare, CalendarEvent, Character, Guild, Role, User } from "./types.ts";
import { addToSet } from "./utils.ts";

const defaultGuild = () => ({ owner: false, advisor: false, voter: false, staff: false, roles: [] });

export async function ensureUser(id: string) {
    await query(`INSERT INTO users VALUES (?, false) ON DUPLICATE KEY UPDATE id = id`, [id]);
}

export async function getUser(id: string): Promise<User> {
    const user: User = { id, guilds: {}, roles: [], observer: false, owner: false, advisor: false, voter: false, council: false, staff: false };

    const [item] = await query(`SELECT observer FROM users WHERE id = ?`, [id]);

    if (item?.observer) {
        user.observer = true;
        user.roles.push("observer");

        user.staff = true;
        user.roles.push("staff");
    }

    for (const { guild } of await query(`SELECT guild FROM guild_staff WHERE user = ?`, [id])) {
        const object = (user.guilds[guild] ??= defaultGuild());
        object.staff = true;
        object.roles.push("staff");
    }

    for (const { guild, role } of await query(`SELECT guild, role FROM guild_roles WHERE user = ?`, [id])) {
        const object = (user.guilds[guild] ??= defaultGuild());
        object.roles.push(role);
    }

    for (const { role } of await query(`SELECT role FROM global_roles WHERE user = ?`, [id])) {
        user.roles.push(role);
    }

    for (const role of ["owner", "advisor"] as const)
        for (const { id: guild, delegated } of await query(`SELECT id, delegated FROM guilds WHERE ${role} = ?`, [id])) {
            addToSet(user.roles, role);

            const object = (user.guilds[guild] ??= defaultGuild());

            object.roles.push(role);
            object[role] = true;

            addToSet(object.roles, "staff");
            object.staff = true;

            for (const item of [role, "staff"] as const) {
                addToSet(user.roles, item);
                user[item] = true;
            }

            if ((role === "advisor") === !!delegated) {
                object.roles.push("voter");
                object.voter = true;

                addToSet(user.roles, "voter");
                user.voter = true;
            }
        }

    if ((user.council = user.observer || user.owner || user.advisor || user.voter)) user.roles.push("council");

    return user;
}

export async function getRole(id: string): Promise<Role> {
    const [role] = await query(`SELECT * FROM roles WHERE id = ?`, [id]);
    return role;
}

export async function getGuild(id: string): Promise<Guild> {
    const [data] = await query(`SELECT * FROM guilds WHERE id = ?`, [id]);
    if (!data) throw new Error(`Guild with ID ${id} not found`);

    const users: Guild["users"] = {};

    users[data.owner] = { staff: true, roles: ["owner"] };
    if (!data.delegated) users[data.owner].roles.push("voter");

    if (data.advisor) {
        users[data.advisor] = { staff: true, roles: ["advisor"] };
        if (data.delegated) users[data.advisor].roles.push("voter");
    }

    for (const { user, role } of await query(`SELECT user, role FROM guild_roles WHERE guild = ?`, [id]))
        (users[user] ??= { staff: false, roles: [] }).roles.push(role);

    for (const { user } of await query(`SELECT user FROM guild_staff WHERE guild = ?`, [id])) (users[user] ??= { staff: false, roles: [] }).staff = true;

    const guild: Guild = {
        id: data.id,
        name: data.name,
        mascot: data.mascot,
        invite: data.invite,
        owner: data.owner,
        advisor: data.advisor || null,
        voter: data.delegated ? data.advisor : data.owner,
        delegated: !!data.delegated,
        users,
    };

    return guild;
}

export async function getAttribute(type: string, id: string): Promise<Attribute> {
    const [data] = await query(`SELECT * FROM attributes WHERE type = ? AND id = ?`, [type, id]);
    return data;
}

export async function getCharacter(id: string): Promise<Character> {
    const [data] = await query(`SELECT * FROM characters WHERE id = ?`, [id]);
    if (!data) return data;

    data.attributes = {};
    for (const { type, value } of await query(`SELECT * FROM character_attributes WHERE \`character\` = ?`, [id])) data.attributes[type] = value;
    return data;
}

export async function getEvent(id: number): Promise<CalendarEvent> {
    const [data] = await query(`SELECT * FROM events WHERE id = ?`, [id]);
    if (!data) return data;

    data.invites = [];
    for (const { code } of await query(`SELECT * FROM event_invites WHERE event = ?`, [id])) data.invites.push(code);
    return data;
}

export async function getBanshare(message: string): Promise<Banshare> {
    const [data] = await query(`SELECT * FROM banshares WHERE message = ?`, [message]);
    if (!data) return data;

    data.ids = [];
    for (const { id } of await query(`SELECT id FROM banshare_ids WHERE banshare = ?`, [message])) data.ids.push(id);

    data.urgent = !!data.urgent;
    return data;
}

async function exists(table: string, id: any, column = "id"): Promise<boolean> {
    const objects = await query(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [id]);
    return objects.length > 0;
}

export async function hasGuild(id: string): Promise<boolean> {
    return await exists("guilds", id);
}

export async function hasRole(id: string): Promise<boolean> {
    return await exists("roles", id);
}

export async function hasAttribute(type: string, id: string): Promise<boolean> {
    const attributes = await query(`SELECT 1 FROM attributes WHERE type = ? AND id = ?`, [type, id]);
    return attributes.length > 0;
}

export async function hasCharacter(id: string): Promise<boolean> {
    return await exists("characters", id);
}

export async function hasEvent(id: number): Promise<boolean> {
    return await exists("events", id);
}

export async function hasBanshare(message: string): Promise<boolean> {
    return await exists("banshares", message, "message");
}
