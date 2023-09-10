import codes from "../../lib/codes.ts";
import { hasAttribute } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /attributes/:type/:id"({ params: { type, id }, user }) {
        if (!user.observer) throw 403;

        if (!(await hasAttribute(type, id))) throw [404, codes.MISSING_ATTRIBUTE, `No attribute with type ${type} and ID ${id} exists.`];

        await query(`DELETE FROM attributes WHERE type = ? AND id = ?`, [type, id]);
    },
} as RouteMap;
