import { describe, expect, test } from "bun:test";
import api from "../api.ts";

describe("GET /stats", () => {
    const route = `GET /v1/stats`;

    test("get stats", async () => {
        const res = await api(null, route);

        expect(res.guildCount).toBeGreaterThanOrEqual(0);
        expect(res.userCount).toBeGreaterThanOrEqual(0);
        expect(res.uptime).toBeGreaterThanOrEqual(0);

        expect(Object.keys(res)).toHaveLength(3);
    });
});
