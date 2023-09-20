import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /autosync"() {
        return await query(`SELECT * FROM autosync`);
    },
} as RouteMap;
