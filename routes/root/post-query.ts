import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "test POST /query"({ body }) {
        return await query(body.query, body.params);
    },
} as RouteMap;
