import codes from "../../lib/codes.ts";
import { getAttribute, hasAttribute } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /attributes/:type/:id"({ params: { type, id }, body, user }) {
        if (!user.observer) throw 403;

        if (!(await hasAttribute(type, id))) throw [404, codes.MISSING_ATTRIBUTE, `No attribute exists with type ${type} and ID ${id}.`];

        if (body.id && body.id !== id && (await hasAttribute(type, body.id)))
            throw [409, codes.DUPLICATE, `An attribute with type ${type} and ID ${body.id} already exists.`];

        const set = [];
        const values = [];

        for (const key of ["id", "name", "emoji"]) {
            const value = body[key];
            if (value === undefined) continue;

            set.push(`${key} = ?`);
            values.push(value);
        }

        if (set.length > 0) await query(`UPDATE attributes SET ${set.join(", ")} WHERE type = ? AND id = ?`, [...values, type, id]);

        return await getAttribute(type, body.id || id);
    },
} as RouteMap;
