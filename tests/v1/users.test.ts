import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { expectError, forgeAdmin, forgeOwner, randomId, randomSnowflake, testE, testScope } from "../utils.ts";

function testUser(user: any) {
    expect(user).toBeDefined();
    expect(user).toHaveProperty("guilds");
    expect(user.observer).toBe(true);
    expect(user.owner).toBeBoolean();
    expect(user.advisor).toBeBoolean();
    expect(user.voter).toBeBoolean();
    expect(user.council).toBe(true);
}

describe("GET /users", () => {
    const route = `GET /v1/users`;

    test("get users", async () => {
        const res = await api(null, route);

        expect(res).toBeArray();
        expect(res.length).toBeGreaterThanOrEqual(1);

        const user = res.find((user: any) => user.id === Bun.env.ADMIN);
        testUser(user);
    });
});

describe("GET /users/:userId", () => {
    const id = Bun.env.ADMIN;
    const route = `GET /v1/users/${id}`;

    test("get user", async () => {
        const res = await api(null, route);

        expect(res.id).toBe(id);
        testUser(res);
    });
});

describe("PATCH /users/:userId", () => {
    const id = randomSnowflake();
    const route = `PATCH /v1/users/${id}`;

    testScope(route);
    testE(401, route);
    testE(403, route, { observer: true });

    test("blank patch", async () => {
        await api(forgeAdmin(), route, {});
    });

    for (const observer of [true, false])
        test(`update user (observer := ${observer})`, async () => {
            const res = await api(forgeAdmin(), route, { observer });
            expect(res.id).toBe(id);
            expect(res.observer).toBe(observer);
        });
});

for (const method of ["PUT", "DELETE"])
    describe(`${method} /users/:userId/roles/:roleId`, () => {
        const id = randomSnowflake();
        const route = `${method} /v1/users/${id}/roles/developer`;

        testScope(route);
        testE(401, route);
        testE(403, route);

        test("block invalid roles", async () => {
            for (const role of ["staff", "banshares", null]) {
                const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/${role ?? randomId()}`);
                await expectError(req, 400, role ? codes.INVALID_ROLE_TYPE : codes.MISSING_ROLE);
            }
        });

        test("update roles", async () => {
            const res = await api(forgeAdmin(), route);
            expect(res.id).toBe(id);

            const { roles } = res;
            if (method === "PUT") expect(roles).toContain("developer");
            else expect(roles).not.toContain("developer");
        });
    });

for (const method of ["PUT", "DELETE"])
    describe(`${method} /users/:userId/roles/:roleId/:guildId`, () => {
        const id = randomSnowflake();
        const guild = testData.GUILD.id;
        const route = `${method} /v1/users/${id}/roles/banshares/${guild}`;

        testScope(route);
        testE(401, route);
        testE(403, route);
        testE([400, codes.MISSING_GUILD], `${method} /v1/users/${id}/roles/banshares/${id}`);

        test("block invalid roles", async () => {
            for (const role of ["staff", "developer", null]) {
                const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/${role ?? randomId()}/${guild}`);
                await expectError(req, 400, role ? codes.INVALID_ROLE_TYPE : codes.MISSING_ROLE);
            }
        });

        test("update roles", async () => {
            const res = await api(forgeOwner(), route);
            expect(res.id).toBe(id);

            const { roles } = res.guilds[guild] ?? {};
            if (method === "PUT") expect(roles).toContain("banshares");
            else expect(roles).toBeUndefined();
        });
    });

for (const method of ["PUT", "DELETE"])
    describe(`${method} /staff/:guildId/:userId`, () => {
        const id = randomSnowflake();
        const guild = testData.GUILD.id;
        const route = `${method} /v1/staff/${guild}/${id}`;

        testScope(route);
        testE(401, route);
        testE(403, route);
        testE([400, codes.MISSING_GUILD], `${method} /v1/staff/${randomSnowflake()}/${id}`);

        test(`${method === "PUT" ? "add" : "remove"} staff`, async () => {
            const res = await api(forgeOwner(), route);
            expect(res.guilds[guild]?.staff ?? false).toBe(method === "PUT");
        });
    });
