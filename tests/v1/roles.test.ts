import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import { ensureUser, getRole, getUser, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { forgeAdmin, randomId, randomSnowflake, testE, testScope } from "../utils.ts";
import { setupRole } from "./setup.ts";

function testRole(role: any) {
    expect(role.id).toBeString();
    expect(role.description).toBeString();
    expect(["pseudo", "global", "guild", "all"]).toContain(role.assignment);
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

    testE([404, codes.MISSING_ROLE], `GET /v1/roles/${randomId()}`);

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

    testScope(route);
    testE(401, route);
    testE(403, route, role);
    testE(409, `POST /v1/roles/observer`, role);
    testE([400, codes.INVALID_ROLE_TYPE], `${route}`, { ...role, assignment: "pseudo" }, del);

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

    testScope(route);
    testE(401, route);
    testE(403, route, {});
    testE([404, codes.MISSING_ROLE], `PATCH /v1/roles/${randomId()}`, {});

    test("blank patch", async () => {
        await api(forgeAdmin(), route, {});
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

    testScope(route);
    testE(401, route);
    testE(403, route);
    testE([404, codes.MISSING_ROLE], `DELETE /v1/roles/${randomId()}`);
    testE([400, codes.INVALID_ROLE_TYPE], `DELETE /v1/roles/observer`);

    test("delete role", async () => {
        const user = randomSnowflake();

        await ensureUser(user);
        await query(`INSERT INTO global_roles VALUES (?, ?) ON DUPLICATE KEY UPDATE user = user`, [user, id]);

        expect((await getUser(user)).roles).toContain(id);

        expect(await hasRole(id)).toBeTrue();
        await api(forgeAdmin(), route);
        expect(await hasRole(id)).toBeFalse();

        expect((await getUser(user)).roles).not.toContain(id);
    });
});
