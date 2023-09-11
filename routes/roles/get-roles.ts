import { getRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /roles"() {
        const ids: { id: string }[] = await query(`SELECT id FROM roles`);
        return await Promise.all(ids.map(({ id }) => getRole(id)));
    },
} as RouteMap;
