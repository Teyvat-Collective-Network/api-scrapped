import di from "../../lib/di.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /tag/:userId"({ params: { userId } }) {
        return (await di(`GET /users?users=${userId}`))[0];
    },
} as RouteMap;
