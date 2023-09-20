import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /polls/activity-check"() {
        const outputs: any[] = [];

        for (const { id, mode, server, wave, question } of await query(`SELECT id, mode, server, wave, question FROM polls`)) {
            const voters: Record<string, boolean> = {};

            for (const { user } of await query(`SELECT user FROM poll_voters WHERE poll = ?`, [id])) voters[user] = false;
            for (const { user } of await query(`SELECT user FROM poll_votes WHERE poll = ?`, [id])) voters[user] = true;

            outputs.push({ id, display: mode === "induction" ? `Induct ${server}?` : mode === "election" ? `Wave ${wave} Election` : question, voters });
        }

        return outputs;
    },
} as RouteMap;
