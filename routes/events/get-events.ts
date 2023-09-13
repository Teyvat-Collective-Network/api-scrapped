import { getEvent } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { CalendarEvent, RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /events"() {
        const output: CalendarEvent[] = [];

        for (const { id } of await query(`SELECT id FROM events`)) output.push(await getEvent(id));

        return output;
    },
} as RouteMap;
