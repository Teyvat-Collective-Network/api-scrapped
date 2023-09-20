import { setVote } from "../../lib/polls.ts";
import { RouteMap } from "../../lib/types.ts";

const cooldown = new Set<string>();

export default {
    async "* PUT /polls/:id/vote"({ params: { id }, body, user }) {
        if (!user.council) throw 403;

        if (cooldown.has(user.id)) throw [429, -1, "Please wait a bit before voting again."];
        cooldown.add(user.id);
        setTimeout(() => cooldown.delete(user.id), 3000);

        await setVote(id, user, body);
    },
} as RouteMap;
