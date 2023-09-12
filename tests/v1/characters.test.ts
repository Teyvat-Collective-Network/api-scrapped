import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import { getCharacter, hasCharacter } from "../../lib/db.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { forgeAdmin, randomId, randomSnowflake, testE, testScope } from "../utils.ts";
import { setupGuild } from "./setup.ts";
import query from "../../lib/query.ts";

function testCharacter(character: any) {
    expect(character.id).toBeString();
    expect(character.name).toBeString();
    expect(character).toHaveProperty("short");
    expect(character).toHaveProperty("attributes");

    for (const value of Object.values(character.attributes)) expect(value).toBeString();
}

describe("GET /characters", () => {
    const route = `GET /v1/characters`;

    test("get characters", async () => {
        const res = await api(null, route);
        for (const character of Object.values(res)) testCharacter(character);
    });
});

describe("GET /characters/:id", () => {
    const [id] = testData.CHARACTERS[0];
    const route = `GET /v1/characters/${id}`;

    testE([404, codes.MISSING_CHARACTER], `GET /v1/characters/${randomId()}`);

    test("get character", async () => {
        const res = await api(null, route);
        testCharacter(res);
    });
});

describe("POST /characters/:id", () => {
    const id = randomId();
    const data = testData.CHAR_1;
    const route = `POST /v1/characters/${id}`;

    const del = () => query(`DELETE FROM characters WHERE id = ?`, [id]);

    testScope(route);
    testE(401, route);
    testE(403, route, data);
    testE([409, codes.DUPLICATE], `POST /v1/characters/${testData.CHARACTERS[0][0]}`, data);
    testE([400, codes.MISSING_ATTRIBUTE], `${route}`, { ...data, attributes: { [randomId()]: randomId() } });

    test("create character", async () => {
        await del();
        await api(forgeAdmin(), route, data);
        const output = await getCharacter(id);
        expect(output).toMatchObject(data);
    });

    test("create character without attributes", async () => {
        await del();
        const altered: any = { ...data };
        delete altered.attributes;

        await api(forgeAdmin(), route, altered);
        const output = await getCharacter(id);
        expect(output).toMatchObject(altered);
    });
});

describe("PATCH /characters/:id", async () => {
    const id = randomId();
    const data = testData.CHAR_2;
    const route = `PATCH /v1/characters/${id}`;

    const old = testData.CHARACTERS[0];
    await query(`INSERT INTO characters VALUES (?) ON DUPLICATE KEY UPDATE name = ?, short = ?`, [[id, old[1], old[2]], old[1], old[2]]);

    testScope(route);
    testE(401, route);
    testE(403, route, data);
    testE([404, codes.MISSING_CHARACTER], `PATCH /v1/characters/${randomId()}`, data);

    test("blank patch", async () => {
        await api(forgeAdmin(), route, {});
    });

    for (const key of ["name", "short", "attributes"] as const)
        test(`update ${key}`, async () => {
            const before = await getCharacter(id);

            if (key === "name" || key === "short") expect(before[key]).toBe(old[key === "name" ? 1 : 2]);

            const res = await api(forgeAdmin(), route, { [key]: data[key] });

            if (key === "name" || key === "short") expect(res[key]).toBe(data[key]);
            else expect(res[key]).toMatchObject(data[key]);
        });
});

describe("DELETE /characters/:id", async () => {
    const id = randomId();
    const route = `DELETE /v1/characters/${id}`;

    const old = testData.CHARACTERS[0];
    await query(`INSERT INTO characters VALUES (?) ON DUPLICATE KEY UPDATE name = ?, short = ?`, [[id, old[1], old[2]], old[1], old[2]]);
    await setupGuild(randomSnowflake());

    testScope(route);
    testE(401, route);
    testE(403, route);
    testE([404, codes.MISSING_CHARACTER], `DELETE /v1/characters/${randomId()}`);
    testE([400, codes.RESOURCE_IN_USE], `DELETE /v1/characters/${testData.GUILD_2.mascot}`);

    test("delete character", async () => {
        expect(await hasCharacter(id)).toBeTrue();
        await api(forgeAdmin(), route);
        expect(await hasCharacter(id)).toBeFalse();
    });
});
