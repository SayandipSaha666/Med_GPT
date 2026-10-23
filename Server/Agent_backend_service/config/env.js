"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
const zod_1 = require("zod");
// Resolve from this service, even when the process is started from the repo root.
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(__dirname, "../.env"), override: false });
const schema = zod_1.z.object({
    AGENT_SERVICE_PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(4000),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: zod_1.z.string().url(),
    AGENT_SERVICE_API_KEY: zod_1.z.string().min(1).optional(),
    AGENT_ALLOWED_ORIGINS: zod_1.z
        .string()
        .transform((value) => value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean))
        .pipe(zod_1.z.array(zod_1.z.string().url()).min(1))
        .optional(),
    RAG_SERVICE_URL: zod_1.z.string().url().default("http://localhost:8000"),
    MODEL_PROVIDER: zod_1.z.enum(["openai", "groq"]).default("openai"),
    OPENAI_AGENT_API_KEY: zod_1.z.string().min(1).optional(),
    GROQ_AGENT_API_KEY: zod_1.z.string().min(1).optional(),
    OPENAI_AGENT_MODEL: zod_1.z.string().min(1).default("gpt-4o-mini"),
    GROQ_AGENT_MODEL: zod_1.z.string().min(1).default("openai/gpt-oss-120b"),
    GUARDRAILS_ENABLED: zod_1.z.coerce.boolean().default(true),
    OPENAI_API_KEY: zod_1.z.string().min(1).optional(),
    ENCRYPTION_MASTER_KEY: zod_1.z.string().min(32).optional(),
    SERPAPI_KEY: zod_1.z.string().min(1).optional(),
    GOOGLE_SEARCH_API_KEY: zod_1.z.string().min(1).optional(),
    GOOGLE_SEARCH_CX: zod_1.z.string().min(1).optional(),
});
exports.env = schema.parse(process.env);
