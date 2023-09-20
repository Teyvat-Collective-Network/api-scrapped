const boolean = { type: "boolean" };
const snowflake = { type: "string", pattern: "^\\d+$", minLength: 17, maxLength: 20 };

export default {
    poll: {
        allOf: [
            {
                type: "object",
                properties: { duration: { type: "number", minimum: 0 }, dm: boolean, live: boolean, restricted: boolean, quorum: { enum: [0, 60, 75] } },
                required: ["duration", "dm", "live", "restricted", "quorum"],
            },
            {
                oneOf: [
                    {
                        type: "object",
                        properties: { mode: { enum: ["induction"] }, preinduct: boolean, server: { type: "string", minLength: 1, maxLength: 32 } },
                        required: ["mode", "preinduct", "server"],
                    },
                    {
                        type: "object",
                        properties: { mode: { enum: ["proposal"] }, question: { type: "string", minLength: 1, maxLength: 256 } },
                        required: ["mode", "question"],
                    },
                    {
                        type: "object",
                        properties: {
                            mode: { enum: ["election"] },
                            wave: { type: "integer", minimum: 1 },
                            seats: { type: "integer", minimum: 1 },
                            candidates: { type: "array", items: snowflake, minItems: 1, maxItems: 20 },
                        },
                        required: ["mode", "wave", "seats", "candidates"],
                    },
                    {
                        type: "object",
                        properties: {
                            mode: { enum: ["selection"] },
                            question: { type: "string", minLength: 1, maxLength: 256 },
                            min: { type: "integer", minimum: 0 },
                            max: { type: "integer", minimum: 1 },
                            options: { type: "array", items: { type: "string", minLength: 1, maxLength: 100 }, minItems: 2, maxItems: 10 },
                        },
                        required: ["mode", "question", "min", "max", "options"],
                    },
                ],
            },
        ],
    },
};
