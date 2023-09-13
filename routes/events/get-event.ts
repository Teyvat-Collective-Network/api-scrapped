import codes from "../../lib/codes.ts";
import { getEvent, hasEvent } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /events/:id"({ params: { id } }) {
        id = parseInt(id);
        if (!(await hasEvent(id))) throw [404, codes.MISSING_EVENT, `No event with ID ${id} exists.`];

        return await getEvent(id);
    },
} as RouteMap;
