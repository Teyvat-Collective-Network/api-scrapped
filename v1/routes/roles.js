export default function (server, _, done) {
    server.get("/", async (_, reply) => {
        return reply.send((await server.db.roles.find()).map((x) => x.toObject()));
    });

    server.post("/", { schema: schemas.post }, async (request, reply) => {
        if (!(await request.observer())) return reply.code(403).send();

        const { id, description, assignment } = request.body;
        if (await server.db.roles.exists({ id })) return reply.code(409).send();

        const item = await server.db.roles.findOneAndUpdate({ id }, { $setOnInsert: { description, assignment } }, { upsert: true });
        if (item) return reply.code(409).send();
        return reply.code(201).send();
    });

    done();
}

const schemas = {
    post: {
        body: {
            type: "object",
            properties: {
                id: { type: "string", minLength: 1, maxLength: 32 },
                description: { type: "string" },
                assignment: { enum: ["pseudo", "guild", "global", "all"] },
            },
            required: ["id", "description", "assignment"],
            additionalProperties: false,
        },
    },
};
