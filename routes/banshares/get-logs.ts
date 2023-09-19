import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /banshares/:guild/logs"({ params: { guild } }) {
        if (!hasGuild(guild)) throw 404;
        return (await query(`SELECT channel FROM banshare_logs WHERE guild = ?`, [guild])).map(({ channel }: { channel: string }) => channel);
    },
} as RouteMap;
