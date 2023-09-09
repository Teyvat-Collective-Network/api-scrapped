import { describe, expect, test } from "bun:test";
import api from "../api.ts";
import { forge, forgeAdmin, forgeOwner, test401, testScope } from "../utils.ts";

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
    const route = `GET /v1/users/${Bun.env.ADMIN}`;

    test("get user", async () => {
        const res = await api(null, route);

        expect(res.id).toBe(Bun.env.ADMIN);
        testUser(res);
    });
});

describe("PATCH /users/:userId", () => {
    const id = "0".repeat(20);
    const route = `PATCH /v1/users/${id}`;

    test("401", test401(route));
    test("scope", testScope(route));

    test("set observer is observer only", async () => {
        const req = await api(forge(), `!${route}`, { observer: true });
        expect(req.status).toBe(403);
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
        const id = "0".repeat(20);
        const route = `${method} /v1/users/${id}/roles/developer`;

        test("401", test401(route));
        test("scope", testScope(route));

        test("observer only", async () => {
            const req = await api(forge(), `!${route}`);
            expect(req.status).toBe(403);
        });

        test("block invalid roles", async () => {
            for (const role of ["staff", "banshares", ""]) {
                const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/${role}`);
                expect(req.status).toBe(400);
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
        const id = "0".repeat(20);
        const guild = Bun.env.TEST_GUILD!;
        const route = `${method} /v1/users/${id}/roles/banshares/${guild}`;

        test("401", test401(route));
        test("scope", testScope(route));

        test("observer/owner only", async () => {
            const req = await api(forge(), `!${route}`);
            expect(req.status).toBe(403);
        });

        test("block invalid roles", async () => {
            for (const role of ["staff", "developer", ""]) {
                const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/${role}/${guild}`);
                expect(req.status).toBe(400);
            }
        });

        test("block invalid guild", async () => {
            const req = await api(forgeAdmin(), `!${method} /v1/users/${id}/roles/banshares/${id}`);
            expect(req.status).toBe(400);
        });

        test("update roles", async () => {
            const res = await api(forgeOwner(), route);
            expect(res.id).toBe(id);

            const { roles } = res.guilds[guild] ?? {};
            if (method === "PUT") expect(roles).toContain("banshares");
            else expect(roles).toBeUndefined();
        });
    });
