import { RouteMap } from "../../types.js";

export default {
    async "* GET /auth/token"({ token }) {
        return token;
    },
} as RouteMap;
