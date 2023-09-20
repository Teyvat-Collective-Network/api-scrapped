import { getPoll } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /polls/close"() {
        for (const { id, restricted } of await query(`SELECT id, restricted FROM polls WHERE NOT closed AND close <= ?`, [Date.now()])) {
            await query(`UPDATE polls SET closed = TRUE WHERE id = ?`, [id]);
            di(`PUT /poll`, await getPoll(id));

            await query(`DELETE FROM poll_voters WHERE poll = ?`, [id]);

            let voters: string[] = [];

            for (const { owner, advisor, delegated } of await query(`SELECT owner, advisor, delegated FROM guilds`)) {
                voters.push(delegated ? advisor : owner);
                if (!restricted) voters.push(delegated ? owner : advisor);
            }

            voters = voters.filter((x) => x);

            if (voters.length > 0) await query(`INSERT INTO poll_voters VALUES ? ON DUPLICATE KEY UPDATE poll = poll`, [voters.map((x) => [id, x])]);
        }
    },
} as RouteMap;
