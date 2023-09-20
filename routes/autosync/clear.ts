import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /autosync/:guild"({ params: { guild } }) {
        await query(`DELETE FROM autosync WHERE guild = ?`, [guild]);
    },
} as RouteMap;
