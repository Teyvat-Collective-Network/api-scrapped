import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /autoroles/:guild"({ params: { guild } }) {
        return [
            ...(await query(`SELECT * FROM autoroles WHERE guild = ?`, [guild])),
            ...(await query(`SELECT * FROM guild_autoroles WHERE guild = ?`, [guild])),
        ];
    },
} as RouteMap;
