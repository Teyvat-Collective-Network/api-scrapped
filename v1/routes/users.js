import { get_user, snowflake } from "../utils.js";

export default function (server, _, done) {
    server.get("/", async (_, reply) => {
        const users = new Map();

        for (const { id } of await server.query(`SELECT id FROM users`)) users.set(id, { guilds: {}, roles: [] });

        for (const { user, guild, role } of await server.query(`SELECT * FROM guild_roles`)) {
            const guilds = users.get(user).guilds;
            guilds[guild] ??= [];
            guilds[guild].push(role);
        }

        for (const { user, role } of await server.query(`SELECT * FROM global_roles`)) {
            users.get(user).roles.push(role);
        }

        for (const { id, owner, advisor } of await server.query(`SELECT id, owner, advisor FROM guilds`)) {
            const x = users.get(owner);
            x.roles.push("owner");
            x.guilds[id] ??= [];
            x.guilds[id].push("owner");

            if (advisor) {
                const y = users.get(advisor);
                y.roles.push("advisor");
                y.guilds[id] ??= [];
                y.guilds[id].push("advisor");
            }
        }

        return reply.send([...users.entries()].map((id, user) => ({ id, ...user })));
    });

    server.post("/", { schema: schemas.post }, async (request, reply) => {
        if (!(await request.auth())) return reply.code(403).send();

        try {
            await server.query(`INSERT INTO users VALUES (?)`, [request.body.id]);
            return reply.code(201).send();
        } catch {
            return reply.code(409).send();
        }
    });

    server.get("/:userid", { schema: schemas.get }, async (request, reply) => {
        return await reply.send(await get_user(request.params.userid));
    });

    server.delete("/:userid", { schema: schemas.get }, async (request, reply) => {
        if (!(await request.admin())) return reply.code(403).send();

        const id = request.params.userid;

        if ((await server.query(`SELECT 1 FROM users WHERE id = ?`, [id])).length === 0) return reply.code(404).send();
        if ((await server.query(`SELECT 1 FROM guilds WHERE owner = ?`, [id])).length > 0) return reply.code(406).send();

        await server.query(`DELETE FROM users WHERE id = ?`, [id]);
    });

    server.put("/:userid/roles", { schema: schemas.roles }, (request, reply) => handle(server, request, reply, true));
    server.delete("/:userid/roles", { schema: schemas.roles }, (request, reply) => handle(server, request, reply, false));

    done();
}

async function handle(server, request, reply, add) {
    const user = await request.auth();
    if (!user) return reply.code(403).send();

    const admin = user.roles.includes(process.env.ADMIN_ROLE);

    const { guild, roles } = request.body;

    if (guild) {
        const [item] = await server.query(`SELECT owner FROM guilds WHERE id = ?`, [guild]);
        if (!item) return reply.code(400).send();
        if (!admin && item.owner !== user.id) return reply.code(403).send();
    } else {
        if (!admin) return reply.code(403).send();
    }

    const key = guild ? "guild" : "global";

    for (const role of roles)
        if ((await server.query(`SELECT 1 FROM roles WHERE id = ? AND assignment IN ("${key}", "all")`, [role])).length === 0) return reply.code(400).send();

    if (add)
        await server.query(`INSERT INTO ${key}_roles VALUES ? ON DUPLICATE KEY UPDATE user = user`, [
            roles.map((role) => [request.params.userid, ...(guild ? [guild] : []), role]),
        ]);
    else
        await server.query(`DELETE FROM ${key}_roles WHERE user = ? ${guild ? `AND guild = ?` : ``} AND role IN ?`, [
            request.params.userid,
            ...(guild ? [guild] : []),
            roles,
        ]);
}

const schemas = {
    post: { body: { type: "object", properties: { id: snowflake }, required: ["id"], additionalProperties: false } },
    get: { params: { type: "object", properties: { userid: snowflake } } },
    roles: {
        body: {
            type: "object",
            properties: { guild: snowflake, roles: { type: "array", items: { type: "string" } } },
            required: ["roles"],
            additionalProperties: false,
        },
    },
};
