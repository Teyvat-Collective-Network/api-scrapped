import { describe, expect, test } from "bun:test";
import api from "../api.ts";
import { forge, forgeAdmin, forgeOwner, test401, expectError, testScope, randomId } from "../utils.ts";
import codes from "../../lib/codes.ts";
import testData from "../testData.ts";

function testUser(user: any) {
    expect(user).not.toBeUndefined();
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
    const id = randomId();
    const route = `PATCH /v1/users/${id}`;

    test("401", test401(route));
    test("scope", testScope(route));

    test("set observer is observer only", async () => {
        const req = await api(forge(), `!${route}`, { observer: true });
        await expectError(req, 403, codes.FORBIDDEN);
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
        const id = randomId();
        const route = `${method} /v1/users/${id}/roles/developer`;

        test("401", test401(route));
        test("scope", testScope(route));

        test("observer only", async () => {
            const req = await api(forge(), `!${route}`);
            await expectError(req, 403, codes.FORBIDDEN);
        });

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
        const id = randomId();
        const guild = testData.GUILD.id;
        const route = `${method} /v1/users/${id}/roles/banshares/${guild}`;

        test("401", test401(route));
        test("scope", testScope(route));

        test("observer/owner only", async () => {
            const req = await api(forge(), `!${route}`);
            await expectError(req, 403, codes.FORBIDDEN);
        });

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
