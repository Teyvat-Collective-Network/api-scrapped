import { getGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /guilds"() {
        const ids: { id: string }[] = await query(`SELECT id FROM guilds`);
        return await Promise.all(ids.map(({ id }) => getGuild(id)));
    },
} as RouteMap;
