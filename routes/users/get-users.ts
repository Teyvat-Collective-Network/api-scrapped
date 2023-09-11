import { getUser } from "../../lib/db.js";
import query from "../../lib/query.js";
import { RouteMap, User } from "../../lib/types.js";

export default {
    async "* GET /users"() {
        const ids: { id: string }[] = await query(`SELECT id FROM users`);
        return await Promise.all(ids.map(({ id }) => getUser(id)));
    },
} as RouteMap;
