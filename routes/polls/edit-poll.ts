import { getPoll } from "../../lib/db.ts";
import { insertPoll } from "../../lib/polls.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PUT /polls/:id"({ params: { id }, body, user }) {
        if (!user.observer) throw 403;

        await insertPoll(body, id);
        return await getPoll(id);
    },
} as RouteMap;
