"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/config/env.ts
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
const zod_1 = require("zod");
// Resolve from this service, even when the process is started from the repo root.
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(__dirname, "../.env"), override: false });
const schema = zod_1.z.object({
    // Node Backend Service
    USER_SERVICE_PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET_KEY: zod_1.z.string().min(1),
    REFRESH_TOKEN_SECRET: zod_1.z.string().min(1),
    RAG_SERVICE_URL: zod_1.z.string().url(),
    AGENT_SERVICE_URL: zod_1.z.string().url().default("http://localhost:4000"),
    AGENT_SERVICE_API_KEY: zod_1.z.string().min(1).optional(),
    FRONTEND_ALLOWED_ORIGINS: zod_1.z
        .string()
        .transform((value) => value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean))
        .pipe(zod_1.z.array(zod_1.z.string().url()).min(1)),
    RAZORPAY_KEY_ID: zod_1.z.string().min(1),
    RAZORPAY_KEY_SECRET: zod_1.z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().min(1),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1),
    MAX_FILE_SIZE_MB: zod_1.z.coerce.number().positive().default(10),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]),
    // Document OCR and ingestion are owned by the user service.
    OCR_PROVIDER: zod_1.z.enum(["gemini", "groq", "openai"]).default("gemini"),
    GEMINI_OCR_API_KEY: zod_1.z.string().min(1).optional(),
    GEMINI_OCR_MODEL: zod_1.z.string().min(1).default("gemini-2.0-flash-exp"),
    GROQ_OCR_API_KEY: zod_1.z.string().min(1).optional(),
    GROQ_OCR_MODEL: zod_1.z.string().min(1).default("qwen/qwen-2.5-32b"),
    OPENAI_OCR_API_KEY: zod_1.z.string().min(1).optional(),
    OPENAI_OCR_MODEL: zod_1.z.string().min(1).default("gpt-5.4"),
    OPENAI_API_URL: zod_1.z.string().url().default("https://llmproxy.int.bluecoppertech.com/v1"),
    // Shared PII encryption (must match Agent_backend_service)
    ENCRYPTION_MASTER_KEY: zod_1.z.string().min(32).optional(),
});
exports.env = schema.parse(process.env);
