import scopecheck from "../lib/scopecheck.js";
import { snowflake } from "../utils.js";

export default function (server, _, done) {
    server.get("/", async (request, reply) => {
        let users = (await server.db.users.find()).map((x) => x.toObject());

        if (request.query.guilds) {
            const guilds = request.query.guilds.split(",");
            const key = request.query.allguilds === "true" ? "every" : "some";
            users = users.filter((user) => guilds[key].bind(guilds)((guild) => user.guilds[guild]));
        }

        if (request.query.roles) {
            const roles = request.query.roles.split(",");
            const key = request.query.anyroles === "true" ? "some" : "every";
            users = users.filter((user) => roles[key].bind(roles)((role) => user.roles.includes(role)));
        }

        return reply.send(users);
    });

    server.post("/", { schema: schemas.post }, async (request, reply) => {
        if (!(await request.auth())) return reply.code(401).send();
        const { id } = request.body;
        const item = await server.db.findOneAndUpdate({ id }, { $set: { id } }, { upsert: true });
        if (item) return reply.code(409).send();
        return reply.code(201).send();
    });

    server.get("/:userid", { schema: schemas.get }, async (request, reply) => {
        const id = request.params.userid;

        const doc = (await server.db.users.findOne({ id }))?.toObject();

        if (doc) {
            for (const key of ["owner", "advisor"])
                for (const item of await server.db.guilds.find({ [key]: id })) {
                    doc.guilds[item.id] ??= [];
                    doc.guilds[item.id].push(key);

                    if ((key === "owner") ^ doc.delegated) doc.guilds[item.id].push("voter");
                }

            return reply.send(doc);
        }

        return reply.code(404).send();
    });

    server.delete("/:userid", { schema: schemas.get }, async (request, reply) => {
        if (!(await request.observer())) return reply.code(403).send();

        const user = (await server.db.users.findOne({ id: request.params.userid }))?.toObject();
        if (!user) return reply.code(404).send();
        if (await server.db.guilds.exists({ owner: user.id })) return reply.code(406).send();

        await server.db.users.deleteOne({ id: request.params.userid });
        return reply.send(user);
    });

    server.put("/:userid/roles", { schema: schemas.rolemod }, (request, reply) => handle(server, request, reply, true));

    server.delete("/:userid/roles", { schema: schemas.rolemod }, (request, reply) => handle(server, request, reply, false));

    done();
}

async function handle(server, request, reply, add) {
    const user = await request.auth();
    if (!scopecheck("users/write", user.scopes)) return reply.code(403).send();

    const data = request.body;
    const observer = user.roles.includes("observer");

    if (!data.guild) {
        if (!observer) return reply.code(403).send();
    } else {
        const doc = (await server.db.guilds.findOne({ id: data.guild }))?.toObject();
        if (!doc) return reply.code(400).send(`no such guild ${data.guild}`);
        if (!observer && doc.owner !== user.id && (data.roles.includes("manager") || !user.guilds[data.guild]?.roles?.includes("manager")))
            return reply.code(403).send();
    }

    const key = data.guild ? "guild" : "global";

    for (const role of data.roles) {
        const doc = (await server.db.roles.findOne({ id: role }))?.toObject();
        if (!doc || (doc.assignment !== "all" && doc.assignment !== key)) return reply.code(400).send(`${role} is not a ${key} role`);
    }

    const item = await server.db.users.findOneAndUpdate(
        { id: request.params.userid },
        {
            [add ? "$addToSet" : "$pull"]: { [data.guild ? `guilds.${data.guild}` : "roles"]: { [add ? "$each" : "$in"]: data.roles } },
            $setOnInsert: data.guild ? { roles: [] } : { guilds: {} },
        },
        { upsert: true, new: true },
    );

    return reply.send(item.toObject());
}

const schemas = {
    post: { body: { type: "object", properties: { id: snowflake }, required: ["id"], additionalProperties: false } },
    get: { params: { type: "object", properties: { userid: snowflake } } },
    rolemod: {
        body: {
            type: "object",
            properties: { guild: snowflake, roles: { type: "array", items: { type: "string" } } },
            required: ["roles"],
            additionalProperties: false,
        },
    },
};
