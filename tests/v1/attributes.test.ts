import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import { getAttribute, hasAttribute } from "../../lib/db.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { expectError, forgeAdmin, randomId, test401, test403, testScope } from "../utils.ts";
import query from "../../lib/query.ts";

async function setupAttribute() {
    const { type, id, name, emoji } = testData.ATTR_1;
    await query(`INSERT INTO attributes VALUES (?) ON DUPLICATE KEY UPDATE id = id`, [[type, id, name, emoji]]);
}

describe("GET /attributes", () => {
    const route = `GET /v1/attributes`;

    test("get attributes", async () => {
        const res = await api(null, route);

        for (const sub of Object.values(res) as any[]) {
            for (const attribute of Object.values(sub) as any[]) {
                expect(attribute.name).toBeString();
                expect(attribute.emoji).toBeString();
            }
        }
    });
});

describe("GET /attributes/:type/:id", () => {
    const data = testData.ATTRS[0];
    const route = `GET /v1/attributes/${data.type}/${data.id}`;

    test("404", async () => {
        const req = await api(null, `!GET /v1/attributes/zxcvbnm/zxcvbnm`);
        await expectError(req, 404, codes.MISSING_ATTRIBUTE);
    });

    test("get attribute", async () => {
        const res = await api(null, route);

        expect(res.type).toBe(data.type);
        expect(res.id).toBe(data.id);
        expect(res.name).toBeString();
        expect(res.emoji).toBeString();
    });
});

describe("POST /attributes/:type/:id", () => {
    const { type, id, ...data } = testData.ATTR_1;
    const route = `POST /v1/attributes/${type}/${id}`;

    const del = () => query(`DELETE FROM attributes WHERE type = ? AND id = ?`, [type, id]);

    test401(route);
    testScope(route);
    test403(route, data);

    test("block duplicate attribute", async () => {
        const req = await api(forgeAdmin(), `!POST /v1/attributes/${testData.ATTRS[0].type}/${testData.ATTRS[0].id}`, data);
        await expectError(req, 409, codes.DUPLICATE);
    });

    test("create attribute", async () => {
        await del();
        await api(forgeAdmin(), route, data);

        const output = await getAttribute(type, id);

        expect(output.type).toBe(type);
        expect(output.id).toBe(id);
        expect(output).toMatchObject(data);
    });
});

describe("PATCH /attributes/:type/:id", async () => {
    const { type, id } = testData.ATTR_1;
    const data = testData.ATTR_2;
    const route = `PATCH /v1/attributes/${type}/${id}`;

    test401(route);
    testScope(route);
    test403(route, data);

    test("404", async () => {
        const req = await api(forgeAdmin(), `!PATCH /v1/attributes/${randomId()}/${randomId()}`, {});
        await expectError(req, 404, codes.MISSING_ATTRIBUTE);
    });

    test("block duplicate ID", async () => {
        const req = await api(forgeAdmin(), `!PATCH /v1/attributes/${testData.ATTRS[0].type}/${testData.ATTRS[1].id}`, { id: testData.ATTRS[0].id });
        await expectError(req, 409, codes.DUPLICATE);
    });

    test("update name", async () => {
        const res = await api(forgeAdmin(), route, { name: data.name });
        expect(res.name).toBe(data.name);
    });

    test("update emoji", async () => {
        const res = await api(forgeAdmin(), route, { emoji: data.emoji });
        expect(res.emoji).toBe(data.emoji);
    });

    test("update ID", async () => {
        await setupAttribute();
        await query(`DELETE FROM attributes WHERE type = ? AND id = ?`, [type, data.id]);

        const res = await api(forgeAdmin(), route, { id: data.id });

        expect(res.id).toBe(data.id);
        expect(await hasAttribute(type, id)).toBe(false);
    });

    await setupAttribute();
});

describe("DELETE /attributes/:type/:id", async () => {
    const { type, id } = testData.ATTR_1;
    const route = `DELETE /v1/attributes/${type}/${id}`;

    test401(route);
    testScope(route);
    test403(route);

    test("404", async () => {
        const req = await api(forgeAdmin(), `!DELETE /v1/attributes/${randomId()}/${randomId()}`);
        await expectError(req, 404, codes.MISSING_ATTRIBUTE);
    });

    test("delete attribute", async () => {
        await setupAttribute();
        await api(forgeAdmin(), route);
        expect(await hasAttribute(type, id)).toBeFalse();
    });
});
