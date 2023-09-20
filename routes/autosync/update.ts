import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /autosync/:guild"({ params: { guild }, body }) {
        if (!hasGuild(guild)) throw 404;

        const [existing] = await query(`SELECT message FROM autosync WHERE guild = ?`, [guild]);
        await query(`REPLACE INTO autosync VALUES (?)`, [[guild, body.channel, existing?.message, body.repost, body.webhook]]);
    },
} as RouteMap;
