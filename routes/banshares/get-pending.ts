import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /banshares/pending"() {
        const messages: string[] = [];
        for (const { message } of await query(`SELECT message FROM banshares WHERE status = 'pending'`)) messages.push(message);
        return messages;
    },
} as RouteMap;
