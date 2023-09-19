import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /banshares/:guild/settings"({ params: { guild } }) {
        if (!(await hasGuild(guild))) throw 404;
        const [data] = await query(`SELECT * FROM banshare_settings WHERE guild = ?`, [guild]);
        return data;
    },
} as RouteMap;
