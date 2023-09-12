import { getUser } from "../../lib/db.js";
import di from "../../lib/di.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* GET /users/:userId"({ params: { userId } }) {
        const user = (await getUser(userId)) as any;

        try {
            [user.tag] = await di(`GET /users?users=${userId}`);
        } catch {}

        return user;
    },
} as RouteMap;
