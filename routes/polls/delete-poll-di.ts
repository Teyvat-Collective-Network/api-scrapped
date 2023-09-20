import { hasPoll } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /polls/:id/di"({ params: { id } }) {
        if (!(await hasPoll(id))) throw 404;
        await query(`DELETE FROM polls WHERE id = ?`, [id]);
    },
} as RouteMap;
