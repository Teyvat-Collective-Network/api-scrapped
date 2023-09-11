import codes from "../../lib/codes.ts";
import { getCharacter, hasCharacter } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /characters/:id"({ params: { id } }) {
        if (!(await hasCharacter(id))) throw [404, codes.MISSING_CHARACTER, `No character with ID ${id} exists.`];
        return await getCharacter(id);
    },
} as RouteMap;
