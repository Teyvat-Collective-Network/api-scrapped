const string = { type: "string" };

export default {
    "GET /auth/key-info": { auth: true },
    "GET /auth/token": { auth: true },
    "GET /auth/me": { auth: true },
    "POST /auth/invalidate": { auth: true },
    "POST /auth/key": {
        auth: true,
        schema: { body: { type: "object", properties: { maxage: { type: "integer", minimum: 1 }, scopes: { type: "array", items: string } } } },
    },
};
