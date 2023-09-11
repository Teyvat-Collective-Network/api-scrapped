import { ensureUser } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import testData from "../testData.ts";
import { randomSnowflake } from "../utils.ts";

export async function setupGuild(id: string) {
    const values: any[] = [id, testData.GUILD_2.name, testData.GUILD_2.mascot, testData.GUILD_2.invite, randomSnowflake(), randomSnowflake(), false];

    await ensureUser(values[4]);
    await ensureUser(values[5]);

    await query(`INSERT INTO guilds VALUES ? ON DUPLICATE KEY UPDATE id = ?, name = ?, mascot = ?, invite = ?, owner = ?, advisor = ?, delegated = ?`, [
        [values],
        ...values,
    ]);
}

export async function setupRole(id: string) {
    const values: any[] = [id, testData.ROLE.description, testData.ROLE.assignment];
    await query(`INSERT INTO roles VALUES ? ON DUPLICATE KEY UPDATE id = ?, description = ?, assignment = ?`, [[values], ...values]);
}

export async function setupAttribute() {
    const { type, id, name, emoji } = testData.ATTR_1;
    await query(`INSERT INTO attributes VALUES (?) ON DUPLICATE KEY UPDATE id = id`, [[type, id, name, emoji]]);
}
