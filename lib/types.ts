import type { ValidateFunction } from "ajv";

export type base = { auth: true; scope?: string } | { auth?: false; scope?: undefined };
export type spec = base & { schema?: Record<string, ValidateFunction> };

export type User = {
    id: string;
    expires?: number;
    scopes?: string[];
    guilds: Record<string, { owner: boolean; advisor: boolean; voter: boolean; staff: boolean; roles: string[] }>;
    roles: string[];
    observer: boolean;
    owner: boolean;
    advisor: boolean;
    voter: boolean;
    staff: boolean;
    council: boolean;
};

export type Role = { id: string; description: string; assignment: string };

export type Guild = {
    id: string;
    name: string;
    mascot: string;
    invite: string;
    owner: string;
    advisor?: string;
    voter: string;
    delegated: boolean;
    users: Record<string, { staff: boolean; roles: string[] }>;
};

export type Attribute = { type: string; id: string; name: string; emoji: string };

export type Handler = (data: { req: Request; params: any; body: any; user: User; token: string }) => any;

export type RouteMap = Record<string, Handler>;
export type Routes = Record<string, Record<string, Record<string, Handler>>>;
