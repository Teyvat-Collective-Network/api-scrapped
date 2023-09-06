import scopecheck from "../lib/scopecheck.js";
import { snowflake } from "../utils.js";

export default async function (server, _, done) {
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

    server.get("/:userid", { schema: schemas.get }, async (request, reply) => {
        const doc = (await server.db.users.findOne({ id: request.params.userid }))?.toObject();
        if (doc) return reply.send(doc);
        return reply.code(404).send();
    });

    done();
}

const schemas = {
    post: {
        body: {
            type: "object",
            properties: {
                id: snowflake,
                guilds: { type: "object", patternProperties: { "^\\d{17,20}$": { type: "array", items: { type: "string" } } } },
                roles: { type: "array", items: { type: "string" } },
            },
            required: ["id"],
            additionalProperties: false,
        },
    },
    get: {
        params: {
            type: "object",
            properties: { userid: snowflake },
        },
    },
    patch: {
        body: {
            type: "object",
            properties: {
                removeGuilds: { type: "array", items: snowflake },
            },
            patternProperties: {
                "(add|remove)Roles": {
                    type: "array",
                    items: {
                        oneOf: [{ type: "string" }, { type: "object", properties: { guild: snowflake, roles: { type: "array", items: { type: "string" } } } }],
                    },
                },
            },
            additionalProperties: false,
        },
    },
};
