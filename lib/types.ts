import type { ValidateFunction } from "ajv";

export type base =
    | { internal?: false; auth: true; scope?: string }
    | { internal?: false; auth?: false; scope?: undefined }
    | { internal: true; auth?: false; scope?: undefined };

export type schemaKeys = "body" | "params" | "query";
export type spec = base & { schema?: Partial<Record<schemaKeys, ValidateFunction>> };

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
    advisor: string | null;
    voter: string;
    delegated: boolean;
    users: Record<string, { staff: boolean; roles: string[] }>;
};

export type Attribute = { type: string; id: string; name: string; emoji: string };
export type Character = { id: string; name: string; short?: string; attributes: Record<string, string> };
export type CalendarEvent = { id: number; owner: string; start: number; end: number; title: string; body: string; invites: string[] };

export type Banshare = {
    author: string;
    rawids: string;
    ids: string[];
    status: string;
    reason: string;
    evidence: string;
    server: string;
    severity: string;
    urgent: boolean;
};

export type Poll = {
    id: number;
    message: string;
    duration: number;
    close: number;
    closed: boolean;
    dm: boolean;
    live: boolean;
    restricted: boolean;
    quorum: number;
    voters: string[];
} & (
    | { mode: "induction"; preinduct: boolean; server: string }
    | { mode: "proposal"; question: string }
    | { mode: "election"; wave: number; seats: number; candidates: string[] }
    | { mode: "selection"; question: string; min: number; max: number; options: string[] }
);

export type PollVote = {
    poll: number;
    user: string;
    mode: "induction" | "proposal" | "election" | "selection";
    missing: boolean;
    abstain: boolean;
    yes: boolean;
    verdict: string;
    ranked: string[];
    countered: string[];
    abstained: string[];
    selected: string[];
};

export type Handler = (data: {
    req: Request;
    params: Record<string, any>;
    search: Record<string, any>;
    body: Record<string, any>;
    user: User;
    token: string;
}) => any;

export type RouteMap = Record<string, Handler>;
export type Routes = Record<string, Record<string, Record<string, Handler>>>;
