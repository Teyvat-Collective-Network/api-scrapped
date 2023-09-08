export default function (server, _, done) {
    server.api("GET /stats", async () => {
        console.log(await server.query(`SELECT COUNT(1) FROM users`));
    });

    done();
}
