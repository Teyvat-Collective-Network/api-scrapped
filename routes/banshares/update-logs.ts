import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /banshares/:guild/logs"({ params: { guild }, body }) {
        if (!(await hasGuild(guild))) throw 404;

        if (body.mode === "clear") await query(`DELETE FROM banshare_logs WHERE guild = ?`, [guild]);
        else if (body.mode === "add") await query(`INSERT INTO banshare_logs VALUES (?, ?) ON DUPLICATE KEY UPDATE channel = channel`, [guild, body.channel]);
        else if (body.mode === "remove") await query(`DELETE FROM banshare_logs WHERE guild = ? AND channel = ?`, [guild, body.channel]);
    },
} as RouteMap;
