import { getCharacter } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { Character, RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /characters"() {
        const characters: Record<string, Character> = {};

        for (const { id } of await query(`SELECT id FROM characters`)) characters[id] = await getCharacter(id);

        return characters;
    },
} as RouteMap;
