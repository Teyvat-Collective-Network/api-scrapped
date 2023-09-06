import uptime from "../lib/uptime.js";

export default function (server, _, done) {
    server.get("/stats", async (_, reply) => {
        return reply.send({ guildCount: await server.db.guilds.countDocuments(), userCount: await server.db.users.countDocuments(), uptime: uptime() });
    });

    done();
}
