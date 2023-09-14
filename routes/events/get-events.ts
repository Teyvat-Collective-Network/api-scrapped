import { getEvent } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { CalendarEvent, RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /events"({ req }) {
        const output: CalendarEvent[] = [];

        const url = new URL(req.url);

        const now = Date.now();

        for (const { id } of await query(
            url.searchParams.get("all") === "true" ? `SELECT id FROM events` : `SELECT id FROM events WHERE end >= ? AND start <= ?`,
            [now - 3 * 24 * 60 * 60 * 1000, now + 60 * 24 * 60 * 60 * 1000],
        ))
            output.push(await getEvent(id));

        return output;
    },
} as RouteMap;
