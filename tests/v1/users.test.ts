import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { expectError, forgeAdmin, forgeOwner, randomSnowflake, test401, test403, testScope } from "../utils.ts";

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

    test401(route);
    testScope(route);
    test403(route, { observer: true });

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

        test401(route);
        testScope(route);
        test403("route");

        test("block invalid roles", async () => {
            for (const role of ["staff", "banshares", ""]) {
                const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/${role}`);
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

        test401(route);
        testScope(route);
        test403(route);

        test("block invalid roles", async () => {
            for (const role of ["staff", "developer", ""]) {
                const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/${role}/${guild}`);
                await expectError(req, 400, role ? codes.INVALID_ROLE_TYPE : codes.MISSING_ROLE);
            }
        });

        test("block missing guild", async () => {
            const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/banshares/${id}`);
            await expectError(req, 400, codes.MISSING_GUILD);
        });

        test("update roles", async () => {
            const res = await api(forgeOwner(), route);
            expect(res.id).toBe(id);

            const { roles } = res.guilds[guild] ?? {};
            if (method === "PUT") expect(roles).toContain("banshares");
            else expect(roles).toBeUndefined();
        });
    });
