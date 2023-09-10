import codes from "../../lib/codes.ts";
import { hasAttribute } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /attributes/:type/:id"({ params: { type, id }, body, user }) {
        if (!user.observer) throw 403;

        if (await hasAttribute(type, id)) throw [409, codes.DUPLICATE, `An attribute with type ${type} and ID ${id} already exists.`];

        await query(`INSERT INTO attributes VALUES (?)`, [[type, id, body.name, body.emoji]]);
    },
} as RouteMap;
