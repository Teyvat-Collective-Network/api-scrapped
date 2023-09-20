import query from "../../lib/query.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* POST /polls/dm"() {
        const [poll] = await query(`SELECT id, message, restricted FROM polls WHERE dm = TRUE AND close <= ? ORDER BY id ASC LIMIT 1`, [
            Date.now() + 24 * 60 * 60 * 1000,
        ]);

        if (!poll) return { none: true };

        const { id, message, restricted } = poll;
        await query(`UPDATE polls SET dm = FALSE WHERE id = ?`, [id]);

        return { id, message, restricted };
    },
} as RouteMap;
