import crypto from "crypto";

function encode(data: any): string {
    return Buffer.from(JSON.stringify(data), "utf-8").toString("base64url");
}

function decode(string: string): any {
    return JSON.parse(Buffer.from(string, "base64url").toString("utf-8"));
}

class JWT {
    private secret: string;
    private header: string;

    constructor(secret: string) {
        this.secret = secret;
        this.header = encode({ alg: "HS256", typ: "JWT" });
    }

    verify(jwt: string): any {
        if (!jwt) return;

        const [header, payload, hash, extra] = jwt.split(".");
        if (!header || !payload || !hash || extra) return false;

        const verify = crypto.timingSafeEqual(
            Buffer.from(crypto.createHmac("sha256", this.secret).update(`${header}.${payload}`, "utf-8").digest("base64url")),
            Buffer.from(hash, "utf-8"),
        );

        if (!verify) return;

        return decode(payload);
    }

    sign(payload: any): string {
        const jwt = `${this.header}.${encode(payload)}`;
        const hash = crypto.createHmac("sha256", this.secret).update(jwt, "utf-8").digest("base64url");
        return `${jwt}.${hash}`;
    }
}

export default new JWT(Bun.env.JWT_SECRET!);
