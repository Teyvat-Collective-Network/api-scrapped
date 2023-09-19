import { hasBanshare } from "../../lib/db.js";
import query from "../../lib/query.js";
import { RouteMap } from "../../lib/types.js";

const operations: Record<string, [string, string]> = {
    publish: ["pending", "published"],
    reject: ["pending", "rejected"],
    rescind: ["published", "rescinded"],
};

export default {
    async "* POST /banshares/:id/:operation"({ params: { id, operation } }) {
        if (!(await hasBanshare(id))) throw 404;

        const [src, dest] = operations[operation];
        const { affectedRows } = await query(`UPDATE banshares SET status = ? WHERE status = ?`, [dest, src]);

        if (affectedRows === 0) throw 400;
    },
} as RouteMap;
