import { hasBanshare, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /banshares/execute/:id/:guild"({ params: { id, guild } }) {
        if (!(await hasBanshare(id)) || !(await hasGuild(guild))) throw 404;

        try {
            await query(`INSERT INTO banshare_executions VALUES (?)`, [[id, guild]]);
        } catch {
            throw 409;
        }
    },
} as RouteMap;
