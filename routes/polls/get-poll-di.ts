import { getPoll, hasPoll } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /polls/:id/di"({ params: { id } }) {
        if (!(await hasPoll(id))) throw 404;
        return await getPoll(id);
    },
} as RouteMap;
