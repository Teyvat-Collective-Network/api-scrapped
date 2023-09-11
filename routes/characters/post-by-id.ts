import codes from "../../lib/codes.ts";
import { hasAttribute, hasCharacter } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /characters/:id"({ params: { id }, body, user }) {
        if (!user.observer) throw 403;
        if (await hasCharacter(id)) throw [409, codes.DUPLICATE, `A character with ID ${id} already exists.`];

        for (const [key, value] of Object.entries(body.attributes)) {
            if (!(await hasAttribute(key, value as string))) throw [400, codes.MISSING_ATTRIBUTE, `No attribute exists with type ${key} and ID ${value}.`];
        }

        await query(`INSERT INTO characters VALUES (?)`, [[id, body.name, body.short]]);

        for (const [key, value] of Object.entries(body.attributes)) await query(`INSERT INTO character_attributes VALUES (?)`, [[id, key, value]]);
    },
} as RouteMap;
