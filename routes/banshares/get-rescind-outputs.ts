import { hasBanshare } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /banshares/:id/rescind-outputs"({ params: { id } }) {
        if (!(await hasBanshare(id))) throw 404;

        return await query(
            `SELECT posts.url, subs.channel FROM banshare_crossposts as posts INNER JOIN banshare_subscribers as subs ON posts.guild = subs.guild WHERE posts.banshare = ?`,
            [id],
        );
    },
} as RouteMap;
