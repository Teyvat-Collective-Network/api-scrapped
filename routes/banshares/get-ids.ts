import { hasBanshare } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /banshares/:id/ids"({ params: { id } }) {
        if (!(await hasBanshare(id))) throw 404;
        return (await query(`SELECT id FROM banshare_ids WHERE banshare = ?`, [id])).map(({ id }: { id: string }) => id);
    },
} as RouteMap;
