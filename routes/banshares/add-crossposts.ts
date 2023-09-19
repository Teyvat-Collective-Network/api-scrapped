import { hasBanshare } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /banshares/:id/crossposts"({ params: { id }, body }) {
        if (!(await hasBanshare(id))) throw 404;
        if (body.crossposts.length === 0) return;

        await query(`INSERT INTO banshare_crossposts VALUES ? ON DUPLICATE KEY UPDATE url = url`, [
            body.crossposts.map(({ guild, url }: { guild: string; url: string }) => [id, guild, url]),
        ]);
    },
} as RouteMap;
