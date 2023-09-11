import { getUser } from "../../lib/db.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* GET /users/:userId"({ params: { userId } }) {
        return await getUser(userId);
    },
} as RouteMap;
