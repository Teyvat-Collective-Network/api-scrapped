import { getPoll, getVote, hasPoll } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /polls/:id/vote/di/:user"({ params: { id, user } }) {
        if (!(await hasPoll(id))) throw 404;
        return await getVote(await getPoll(id), user);
    },
} as RouteMap;
