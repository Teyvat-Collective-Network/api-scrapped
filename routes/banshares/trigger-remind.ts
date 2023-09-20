import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /banshares/remind"() {
        const now = Date.now();
        const uthresh = now - 2 * 60 * 60 * 1000;
        const nthresh = now - 6 * 60 * 60 * 1000;

        const { affectedRows } = await query(
            `UPDATE banshares SET reminded = ? WHERE status = 'pending' AND ((urgent AND reminded < ?) OR (NOT urgent AND reminded < ?))`,
            [now, uthresh, nthresh],
        );

        return { remind: affectedRows > 0 };
    },
} as RouteMap;
