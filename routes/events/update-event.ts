import codes from "../../lib/codes.ts";
import { getEvent, hasEvent } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /events/:id"({ params: { id }, body, user }) {
        id = parseInt(id);
        if (!(await hasEvent(id))) throw [404, codes.MISSING_EVENT, `No event with ID ${id} exists.`];

        if (!user.observer) {
            const { owner } = await getEvent(id);
            if (user.id !== owner) throw 403;
        }

        if (body.start > body.end) throw [400, codes.INVALID_BODY, "Event must not end before it starts."];

        await query(`UPDATE events SET start = ?, end = ?, title = ?, body = ? WHERE id = ?`, [body.start, body.end, body.title, body.body, id]);
        await query(`DELETE FROM event_invites WHERE event = ?`, [id]);
        if (body.invites.length > 0) await query(`INSERT INTO event_invites VALUES ?`, [body.invites.map((code: string) => [id, code])]);
    },
} as RouteMap;
