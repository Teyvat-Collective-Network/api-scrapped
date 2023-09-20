import { getPoll, getUser, getVote, hasPoll } from "../../lib/db.ts";
import { setVote } from "../../lib/polls.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /polls/:id/vote/di"({ params: { id }, body }) {
        if (!(await hasPoll(id))) throw 404;
        const user = await getUser(body.user);

        await setVote(id, user, body);
        return await getVote(await getPoll(id), user.id);
    },
} as RouteMap;
