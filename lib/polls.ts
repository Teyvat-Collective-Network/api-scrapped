import codes from "./codes.ts";
import { getPoll, getUser, hasPoll } from "./db.ts";
import di from "./di.ts";
import query from "./query.ts";
import { User } from "./types.ts";

export async function insertPoll(body: any, id?: number): Promise<number> {
    if (id !== undefined && !(await hasPoll(id))) throw [404, codes.MISSING_POLL, `No poll with ID ${id} exists.`];

    if (body.duration <= 24 && body.dm) throw [400, codes.INVALID_POLL_DATA, "The DM reminder can only be enabled if more than 24 hours are left."];

    if (body.mode === "election") {
        for (const user of body.candidates as string[]) if (!(await getUser(user)).council) throw "Only council members may be candidates in an election.";
    } else if (body.mode === "selection") {
        if (body.min > body.max) throw [400, codes.INVALID_POLL_DATA, "Minimum option count cannot exceed maximum option count."];
        if (body.min >= body.options.length) throw [400, codes.INVALID_POLL_DATA, "Minimum option count must be less than the number of options."];
        if (body.max > body.options.length) throw [400, codes.INVALID_POLL_DATA, "Maximum option count must not exceed the number of options."];
    }

    body.close = Date.now() + body.duration * 60 * 60 * 1000;
    body.closed = body.duration === 0;

    const args = [
        body.duration,
        body.close,
        body.closed,
        body.dm,
        body.live,
        body.restricted,
        body.quorum,
        body.mode,
        body.preinduct ?? false,
        body.server ?? "-",
        body.question ?? "-",
        body.wave ?? 1,
        body.seats ?? 1,
        body.min ?? 1,
        body.max ?? 1,
    ];

    if (id !== undefined) {
        const poll = await getPoll(id);

        const req = await di(`!PUT /poll`, { id, message: poll.message, ...body });
        const { message } = await req.json();

        if (!req.ok) {
            throw [500, codes.INTERNAL_ERROR, "An unexpected error occurred."];
        }

        if (body.mode !== poll.mode) await query(`DELETE FROM poll_votes WHERE poll = ?`, [id]);
        di(`!PUT /poll`, { id, message, ...body }).catch(() => {}); // Ignore errors this time, as the edit is already committed.

        await query(
            `UPDATE polls SET message = ?, duration = ?, close = ?, closed = ?, dm = ?, live = ?, restricted = ?, quorum = ?, mode = ?, preinduct = ?, server = ?, question = ?, wave = ?, seats = ?, min = ?, max = ? WHERE id = ?`,
            [message, ...args, id],
        );

        if (body.mode === "election") {
            await query(`DELETE FROM poll_candidates WHERE poll = ? AND user NOT IN (?)`, [id, body.candidates]);
            await query(`INSERT INTO poll_candidates VALUES ? ON DUPLICATE KEY UPDATE poll = poll`, [body.candidates.map((x: string) => [id, x])]);
        } else if (body.mode === "selection") {
            await query(`DELETE FROM poll_options WHERE poll = ? AND \`option\` NOT IN (?)`, [id, body.options]);
            await query(`INSERT INTO poll_options VALUES ? ON DUPLICATE KEY UPDATE poll = poll`, [body.options.map((x: string) => [id, x])]);
        }

        return id;
    } else {
        const { insertId } = await query(`INSERT INTO polls VALUES (?)`, [[id ?? null, "", ...args]]);

        const req = await di(`!POST /poll`, { id: id ?? insertId, ...body });
        const { message } = await req.json();

        if (!req.ok) {
            await query(`DELETE FROM polls WHERE id = ?`, [insertId]);
            throw [500, codes.INTERNAL_ERROR, "An unexpected error occurred."];
        }

        await query(`UPDATE polls SET message = ? WHERE id = ?`, [message, insertId]);

        if (body.mode === "election") await query(`INSERT INTO poll_candidates VALUES ?`, [body.candidates.map((user: string) => [insertId, user])]);
        else if (body.mode === "selection") await query(`INSERT INTO poll_options VALUES ?`, [body.options.map((option: string) => [insertId, option])]);

        return insertId;
    }
}

const requiredField = { induction: "verdict", proposal: "yes", election: "candidates", selection: "selected" };
const article = { induction: "an", proposal: "a", election: "an", selection: "a" };

export async function setVote(id: number, user: User, body: any) {
    if (!(await hasPoll(id))) throw [404, codes.MISSING_POLL, `No poll with ID ${id} exists.`];

    const poll = await getPoll(id);
    if (poll.restricted && !user.voter) throw 403;

    if (body.abstain) await query(`INSERT INTO poll_votes VALUES (?, ?, TRUE, FALSE, 0) ON DUPLICATE KEY UPDATE abstain = TRUE`, [id, user.id]);
    else {
        const field = requiredField[poll.mode];
        if (!(field in body)) throw [400, codes.INVALID_VOTE, `Your vote for ${article[poll.mode]} ${poll.mode} poll must contain the '${field}' field.`];

        if (poll.mode === "induction") {
            const verdict = ["reject", "extend", "induct-now", "induct-later"].indexOf(body.verdict) ?? 0;
            if (verdict === 3 && !poll.preinduct) throw [400, codes.INVALID_VOTE, "You cannot vote 'induct-later' on a poll with preinduction disabled."];

            await query(`INSERT INTO poll_votes VALUES (?, ?, FALSE, FALSE, ?) ON DUPLICATE KEY UPDATE abstain = FALSE, verdict = ?`, [
                id,
                user.id,
                verdict,
                verdict,
            ]);
        } else if (poll.mode === "proposal") {
            await query(`INSERT INTO poll_votes VALUES (?, ?, FALSE, ?, 0) ON DUPLICATE KEY UPDATE abstain = FALSE, yes = ?`, [
                id,
                user.id,
                body.yes,
                body.yes,
            ]);
        } else if (poll.mode === "election") {
            await query(`INSERT INTO poll_votes VALUES (?, ?, FALSE, FALSE, 0) ON DUPLICATE KEY UPDATE abstain = FALSE`, [id, user.id]);

            const used = new Set<number>();
            const rankMode = poll.candidates.length > poll.seats;
            const entries = Object.entries(body.candidates as Record<string, number>);

            for (const [id, rank] of entries) {
                if (!poll.candidates.includes(id)) throw [400, codes.INVALID_VOTE, `${id} is not a valid candidate ID.`];

                if (rankMode) {
                    if (rank > 0) {
                        if (used.has(rank)) throw [400, codes.INVALID_VOTE, `You ranked multiple candidates #${rank}.`];
                        used.add(rank);
                    }
                } else {
                    if (rank > 1) throw [400, codes.INVALID_VOTE, "You can only vote -1, 0, or 1 in non-competitive elections."];
                }
            }

            for (let x = 1; x <= used.size; x++) if (!used.has(x)) throw [400, codes.INVALID_VOTE, `You did not rank any candidates #${x}.`];

            await query(`DELETE FROM poll_votes_elections WHERE poll = ? AND user = ?`, [id, user.id]);
            await query(`INSERT INTO poll_votes_elections VALUES ?`, [entries.map(([target, rank]) => [id, user.id, target, rank])]);
        } else if (poll.mode === "selection") {
            await query(`INSERT INTO poll_votes VALUES (?, ?, FALSE, FALSE, 0) ON DUPLICATE KEY UPDATE abstain = FALSE`, [id, user.id]);

            const selected = [...new Set(body.selected as string[])];

            for (const option of selected)
                if (!poll.options.includes(option)) throw [400, codes.INVALID_VOTE, "One of the options you selected is not a valid poll option."];

            await query(`DELETE FROM poll_votes_selections WHERE poll = ? AND user = ?`, [id, user.id]);
            if (selected.length > 0) await query(`INSERT INTO poll_votes_selections VALUES ?`, [selected.map((option) => [id, user.id, option])]);
        }
    }

    di(`!PUT /poll`, poll).catch(); // Do not care about errors or if it is offline
}
