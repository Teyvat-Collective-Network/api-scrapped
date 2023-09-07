import uptime from "../lib/uptime.js";

export default function (server, _, done) {
    server.get("/stats", async (_, reply) => {
        return reply.send({
            guildCount: (await server.query("SELECT COUNT(*) FROM guilds"))[0]["COUNT(*)"],
            userCount: (await server.query("SELECT COUNT(*) FROM users"))[0]["COUNT(*)"],
            uptime: uptime(),
        });
    });

    done();
}
