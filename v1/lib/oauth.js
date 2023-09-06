const base = "https://discord.com/api";

export default {
    async user(options) {
        const request = await fetch(base + "/users/@me", { headers: { Authorization: `Bearer ${options.access_token}` } });
        const response = await request.json();
        if (!request.ok) throw Object.assign(new Error(request.statusText), { data: response });
        return response;
    },

    async token(options) {
        const request = await fetch(base + "/oauth2/token", { method: "POST", body: new URLSearchParams({ ...options, grant_type: "authorization_code" }) });
        const response = await request.json();
        if (!request.ok) throw Object.assign(new Error(request.statusText), { data: response });
        return response;
    },
};
