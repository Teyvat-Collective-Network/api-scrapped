import codes from "../../lib/codes.ts";
import { getEvent, hasEvent } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /events/:id"({ params: { id }, user }) {
        id = parseInt(id);
        if (!(await hasEvent(id))) throw [404, codes.MISSING_EVENT, `No event with ID ${id} exists.`];

        if (!user.observer) {
            const { owner } = await getEvent(id);
            if (user.id !== owner) throw 403;
        }

        await query(`DELETE FROM events WHERE id = ?`, [id]);
    },
} as RouteMap;
