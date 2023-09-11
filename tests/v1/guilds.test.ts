import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import { getGuild, hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { forgeAdmin, randomSnowflake, testE, testScope } from "../utils.ts";
import { setupGuild } from "./setup.ts";

function testGuild(guild: any) {
    expect(guild).toBeDefined();
    expect(guild.name).toBeString();
    expect(guild.mascot).toBeString();
    expect(guild.invite).toBeString();
    expect(guild.owner).toBe(Bun.env.ADMIN);
    expect(guild.advisor).toBe(testData.ADMIN_2);
    expect(guild.voter).toBe(guild.delegated ? guild.advisor : guild.owner);
    expect(guild).toHaveProperty("delegated");
    expect(guild).toHaveProperty("users");
}

describe("GET /guilds", () => {
    const route = `GET /v1/guilds`;

    test("get guilds", async () => {
        const res = await api(null, route);

        expect(res).toBeArray();
        expect(res.length).toBeGreaterThanOrEqual(1);

        const guild = res.find((guild: any) => guild.id === testData.GUILD.id);
        testGuild(guild);
    });
});

describe("GET /guilds/:guildId", () => {
    const { id } = testData.GUILD;
    const route = `GET /v1/guilds/${id}`;

    testE([404, codes.MISSING_GUILD], `GET /v1/guilds/${randomSnowflake()}`);

    test("get guild", async () => {
        const res = await api(null, route);

        expect(res.id).toBe(id);
        testGuild(res);
    });
});

describe("POST /guilds/:guildId", async () => {
    const { id, ...guild } = testData.GUILD_2 as any;
    const user1 = randomSnowflake();
    const user2 = randomSnowflake();
    const route = `POST /v1/guilds/${id}`;

    guild.owner = user1;
    guild.advisor = user2;
    guild.delegated = false;

    const del = () => query(`DELETE FROM guilds WHERE id = ?`, [id]);

    testScope(route);
    testE(401, route);
    testE(403, route, guild);
    testE(409, `POST /v1/guilds/${testData.GUILD.id}`, guild);
    testE([400, codes.DELEGATED_WITHOUT_ADVISOR], `${route}`, { ...guild, advisor: null, delegated: true }, del);
    testE([400, codes.MISSING_CHARACTER], `${route}`, { ...guild, mascot: "" }, del);
    testE([400, codes.INVALID_INVITE], `${route}`, { ...guild, invite: testData.OTHER_INVITE }, del);

    test("create guild", async () => {
        await api(forgeAdmin(), route, guild);

        const output = await getGuild(id);

        expect(output).toMatchObject(guild);
        expect(output.voter).toBe(guild.owner);

        for (const role of ["owner", "voter"]) expect(output.users[guild.owner].roles).toContain(role);
        expect(output.users[guild.advisor].roles).toContain("advisor");

        expect(output.users[guild.owner].staff).toBeTrue();
        expect(output.users[guild.advisor].staff).toBeTrue();
    });
});

describe("PATCH /guilds/:guildId", async () => {
    const { id } = testData.GUILD_2;
    const route = `PATCH /v1/guilds/${id}`;

    await setupGuild(id);

    testScope(route);
    testE(401, route);
    testE(403, route, {});
    testE([404, codes.MISSING_GUILD], `PATCH /v1/guilds/${randomSnowflake()}`, {});

    testE([400, codes.DELEGATED_WITHOUT_ADVISOR], `${route}`, { advisor: undefined, delegated: true }, () =>
        query(`UPDATE guilds SET advisor = NULL WHERE id = ?`, [id]),
    );

    testE([400, codes.MISSING_CHARACTER], `${route}`, { mascot: "" });
    testE([400, codes.INVALID_INVITE], `${route}`, { invite: testData.OTHER_INVITE });

    test("blank patch", async () => {
        await api(forgeAdmin(), route, {});
    });

    const data = { ...testData.GUILD_3, owner: randomSnowflake(), advisor: randomSnowflake() };

    for (const key of Object.keys(data) as (keyof typeof data)[])
        test(`update ${key}`, async () => {
            const res = await api(forgeAdmin(), route, { [key]: data[key] });
            expect(res[key]).toBe(data[key]);
        });

    test("update delegated", async () => {
        const before = await getGuild(id);
        expect(before.voter).toBe(data.owner);

        const res = await api(forgeAdmin(), route, { delegated: true });
        expect(res.voter).toBe(data.advisor);
    });

    test("remove advisor", async () => {
        await setupGuild(id);
        await query(`UPDATE guilds SET delegated = true WHERE id = ?`, [id]);

        const before = await getGuild(id);
        expect(before.advisor).toBeString();
        expect(before.delegated).toBeTrue();

        const res = await api(forgeAdmin(), route, { advisor: null });
        expect(res.advisor).toBeNull();
        expect(res.delegated).toBeFalse();
    });
});

describe("DELETE /guilds/:guildId", async () => {
    const { id } = testData.GUILD_2;
    const route = `DELETE /v1/guilds/${id}`;

    await setupGuild(id);

    testScope(route);
    testE(401, route);
    testE(403, route);
    testE([404, codes.MISSING_GUILD], `DELETE /v1/guilds/${randomSnowflake()}`);

    test("delete guild", async () => {
        expect(await hasGuild(id)).toBeTrue();
        await api(forgeAdmin(), route);
        expect(await hasGuild(id)).toBeFalse();
    });
});
