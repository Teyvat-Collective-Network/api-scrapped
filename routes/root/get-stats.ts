import query from "../../lib/query.js";
import uptime from "../../lib/uptime.js";
import { RouteMap } from "../../types.js";

export default {
    async "* GET /stats"() {
        const [{ "COUNT(1)": guildCount }] = await query(`SELECT COUNT(1) FROM guilds`);
        const [{ "COUNT(1)": userCount }] = await query(`SELECT COUNT(1) FROM users`);

        return { guildCount, userCount, uptime: uptime() };
    },
} as RouteMap;
