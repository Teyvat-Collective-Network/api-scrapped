import { getUser } from "../../lib/db.js";
import { RouteMap } from "../../types.js";

export default {
    async "* GET /users/:userId"({ params: { userId } }) {
        return await getUser(userId);
    },
} as RouteMap;
