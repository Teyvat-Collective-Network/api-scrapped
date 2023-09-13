import codes from "../../lib/codes.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /events"({ body, user }) {
        if (!user.council) throw 403;

        if (body.start > body.end) throw [400, codes.INVALID_BODY, "Event must not end before it starts."];

        const { insertId: id } = await query(`INSERT INTO events VALUES (?)`, [[null, user.id, body.start, body.end, body.title, body.body]]);

        await query(
            `INSERT INTO event_invites VALUES ?`,
            body.invites.map((code: string) => [id, code]),
        );

        return { id };
    },
} as RouteMap;
