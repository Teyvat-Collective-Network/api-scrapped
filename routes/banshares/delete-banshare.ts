import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /banshares/:id"({ params: { id } }) {
        await query(`DELETE FROM banshares WHERE message = ?`, [id]);
    },
} as RouteMap;
