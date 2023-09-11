import query from "../../lib/query.ts";
import { Attribute, RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /attributes"() {
        const attributes: Record<string, Record<string, Pick<Attribute, "name" | "emoji">>> = {};

        for (const { type, id, ...rest } of await query(`SELECT * FROM attributes`)) {
            (attributes[type] ??= {})[id] = rest;
        }

        return attributes;
    },
} as RouteMap;
