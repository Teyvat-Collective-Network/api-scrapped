import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /autosync/:guild/:message"({ params: { guild, message } }) {
        await query(`UPDATE autosync SET message = ? WHERE guild = ?`, [message, guild]);
    },
} as RouteMap;
