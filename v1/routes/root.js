import uptime from "../lib/uptime.js";

export default function (server, _, done) {
    server.api("GET /stats", async () => {
        const [{ "COUNT(1)": guildCount }] = await server.query(`SELECT COUNT(1) FROM guilds`);
        const [{ "COUNT(1)": userCount }] = await server.query(`SELECT COUNT(1) FROM users`);
        return { guildCount, userCount, uptime: uptime() };
    });

    done();
}
