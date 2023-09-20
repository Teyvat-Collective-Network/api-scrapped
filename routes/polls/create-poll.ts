import { getPoll } from "../../lib/db.ts";
import { insertPoll } from "../../lib/polls.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /polls"({ body, user }) {
        if (!user.observer) throw 403;

        const id = await insertPoll(body);
        return await getPoll(id);
    },
} as RouteMap;
