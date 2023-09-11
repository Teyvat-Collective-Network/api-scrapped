import codes from "../../lib/codes.ts";
import { hasCharacter } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /characters/:id"({ params: { id }, user }) {
        if (!user.observer) throw 403;
        if (!(await hasCharacter(id))) throw [404, codes.MISSING_CHARACTER, `No character exists with ID ${id}.`];

        const [{ "COUNT(1)": used }] = await query(`SELECT COUNT(1) FROM guilds WHERE mascot = ?`, [id]);
        if (used) throw [400, codes.RESOURCE_IN_USE, `At least one guild has its mascot set to the character with ID ${id}.`];

        await query(`DELETE FROM characters WHERE id = ?`, [id]);
    },
} as RouteMap;
