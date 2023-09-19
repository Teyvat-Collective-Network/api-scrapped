import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /banshares/:guild/set-output"({ params: { guild }, body }) {
        if (guild !== Bun.env.HUB && !(await hasGuild(guild))) throw 404;

        if (body.channel) await query(`INSERT INTO banshare_subscribers VALUES (?) ON DUPLICATE KEY UPDATE channel = ?`, [[guild, body.channel], body.channel]);
        else await query(`DELETE FROM banshare_subscribers WHERE guild = ?`, [guild]);
    },
} as RouteMap;
