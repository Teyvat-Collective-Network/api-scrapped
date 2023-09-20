import codes from "../../lib/codes.ts";
import { getPoll, hasPoll } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /polls/:id"({ params: { id }, user }) {
        if (!user.council) throw 403;
        if (!(await hasPoll(id))) throw [404, codes.MISSING_POLL, `No poll with ID ${id} exists.`];
        return await getPoll(id);
    },
} as RouteMap;
