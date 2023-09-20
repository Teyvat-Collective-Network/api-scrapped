import codes from "../../lib/codes.ts";
import { hasPoll } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* DELETE /polls/:id"({ params: { id }, user }) {
        if (!user.observer) throw 403;
        if (!(await hasPoll(id))) throw [404, codes.MISSING_POLL, `No poll with ID ${id} exists.`];

        const [{ message }] = await query(`SELECT message FROM polls WHERE id = ?`, [id]);
        di(`DELETE /poll/${message}`).catch(() => {}); // Do not care about errors or if it is offline
        await query(`DELETE FROM polls WHERE id = ?`, [id]);
    },
} as RouteMap;
