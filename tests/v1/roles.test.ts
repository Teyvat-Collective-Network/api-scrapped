import { describe, expect, test } from "bun:test";
import api from "../api.ts";
import testData from "../testData.ts";
import { expect403, expectError, forge, forgeAdmin, randomId, test401, testScope } from "../utils.ts";
import codes from "../../lib/codes.ts";
import { ensureUser, getRole, getUser, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";

function testRole(role: any) {
    expect(role.id).toBeString();
    expect(role.description).toBeString();
    expect(["pseudo", "global", "guild", "all"]).toContain(role.assignment);
}

async function setupRole(id: string) {
    const values: any[] = [id, testData.ROLE.description, testData.ROLE.assignment];
    await query(`INSERT INTO roles VALUES ? ON DUPLICATE KEY UPDATE id = ?, description = ?, assignment = ?`, [[values], ...values]);
}

describe("GET /roles", () => {
    const route = `GET /v1/roles`;

    test("get roles", async () => {
        const res = await api(null, route);
        expect(res).toBeArray();
        for (const role of res) testRole(role);
    });
});

describe("GET /roles/:roleId", () => {
    const id = "observer";
    const route = `GET /v1/roles/${id}`;

    test("404", async () => {
        const req = await api(null, `!GET /v1/roles/zxcvbnm`);
        expectError(req, 404, codes.MISSING_ROLE);
    });

    test("get role", async () => {
        const res = await api(null, route);
        expect(res.id).toBe(id);
        testRole(res);
    });
});

describe("POST /roles/:roleId", () => {
    const { id, ...role } = testData.ROLE;
    const route = `POST /v1/roles/${id}`;

    const del = () => query(`DELETE FROM roles WHERE id = ?`, [id]);

    test401(route);
    testScope(route);

    test("observer only", async () => {
        await expect403(route, role);
    });

    test("block duplicate role", async () => {
        const req = await api(forgeAdmin(), `!POST /v1/roles/observer`, role);
        await expectError(req, 409, codes.DUPLICATE);
    });

    test("block pseudo role", async () => {
        await del();
        const req = await api(forgeAdmin(), `!${route}`, { ...role, assignment: "pseudo" });
        await expectError(req, 400, codes.INVALID_ROLE_TYPE);
    });

    test("create role", async () => {
        await del();
        await api(forgeAdmin(), route, role);

        const output = await getRole(id);

        expect(output.id).toBe(id);
        expect(output).toMatchObject(role);
    });
});

describe("PATCH /roles/:roleId", async () => {
    const { id } = testData.ROLE;
    const role = testData.ROLE_2;
    const route = `PATCH /v1/roles/${id}`;

    await setupRole(id);

    test401(route);
    testScope(route);

    test("observer only", async () => {
        await expect403(route, {});
    });

    test("block missing role", async () => {
        const req = await api(forgeAdmin(), `!PATCH /v1/roles/zxcvbnm`, {});
        await expectError(req, 404, codes.MISSING_ROLE);
    });

    test("update description", async () => {
        const before = await getRole(id);
        expect(before.description).toBe(testData.ROLE.description);

        const res = await api(forgeAdmin(), route, { description: role.description });
        expect(res.description).toBe(role.description);
    });
});

describe("DELETE /roles/:roleId", async () => {
    const { id } = testData.ROLE;
    const route = `DELETE /v1/roles/${id}`;

    await setupRole(id);

    test401(route);
    testScope(route);

    test("observer only", async () => {
        await expect403(route);
    });

    test("block missing role", async () => {
        const req = await api(forgeAdmin(), `!DELETE /v1/roles/zxcvbnm`);
        await expectError(req, 404, codes.MISSING_ROLE);
    });

    test("block pseudo role", async () => {
        const req = await api(forgeAdmin(), `!DELETE /v1/roles/observer`);
        await expectError(req, 400, codes.INVALID_ROLE_TYPE);
    });

    test("delete role", async () => {
        const user = randomId();

        await ensureUser(user);
        await query(`INSERT INTO global_roles VALUES (?, ?) ON DUPLICATE KEY UPDATE user = user`, [user, id]);

        expect((await getUser(user)).roles).toContain(id);

        expect(await hasRole(id)).toBeTrue();
        await api(forgeAdmin(), route);
        expect(await hasRole(id)).toBeFalse();

        expect((await getUser(user)).roles).not.toContain(id);
    });
});
