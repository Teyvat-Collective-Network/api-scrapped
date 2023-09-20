import { getPoll } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /polls"({ user, search }) {
        if (!user.council) throw 403;
        const ids: { id: number }[] = await query(
            `SELECT id FROM polls${search.open === "true" ? ` WHERE NOT closed${user.voter ? "" : " AND NOT restricted"}` : ""}`,
        );
        return await Promise.all(ids.map(({ id }) => getPoll(id)));
    },
} as RouteMap;
