import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /autosync/:guild"({ params: { guild } }) {
        const [data] = await query(`SELECT * FROM autosync WHERE guild = ?`, [guild]);
        if (!data) throw 404;

        return data;
    },
} as RouteMap;
