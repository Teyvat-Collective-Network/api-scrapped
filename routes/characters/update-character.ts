import codes from "../../lib/codes.ts";
import { getCharacter, hasCharacter } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /characters/:id"({ params: { id }, body, user }) {
        if (!user.observer) throw 403;

        if (!(await hasCharacter(id))) throw [404, codes.MISSING_CHARACTER, `No character exists with ID ${id}.`];
        if (body.id && body.id !== id && (await hasCharacter(body.id))) throw [409, codes.DUPLICATE, `A character with ID ${id} already exists.`];

        const set = [];
        const values = [];

        for (const key of ["id", "name", "short"]) {
            const value = body[key];
            if (value === undefined) continue;

            set.push(`${key} = ?`);
            values.push(value);
        }

        if (set.length > 0) await query(`UPDATE characters SET ${set.join(", ")} WHERE id = ?`, [...values, id]);

        for (const [key, value] of Object.entries(body.attributes ?? {}))
            if (value === null) await query(`DELETE FROM character_attributes WHERE \`character\` = ? AND type = ?`, [id, key]);
            else await query(`INSERT INTO character_attributes VALUES (?) ON DUPLICATE KEY UPDATE value = ?`, [[id, key, value], value]);

        return await getCharacter(id);
    },
} as RouteMap;
