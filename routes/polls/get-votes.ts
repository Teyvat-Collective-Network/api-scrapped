import { getPoll, getVote, hasPoll } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { PollVote, RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /polls/:id/votes"({ params: { id } }) {
        if (!(await hasPoll(id))) throw 404;
        const poll = await getPoll(id);

        const votes: PollVote[] = [];

        for (const { user } of await query(`SELECT user FROM poll_votes WHERE poll = ?`, [id])) votes.push(await getVote(poll, user));

        return votes;
    },
} as RouteMap;
