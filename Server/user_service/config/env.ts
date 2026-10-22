// src/config/env.ts
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Resolve from this service, even when the process is started from the repo root.
loadDotenv({ path: resolve(__dirname, "../.env"), override: false });

const schema = z.object({
    // Node Backend Service
    USER_SERVICE_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    DATABASE_URL: z.string().url(),

    JWT_SECRET_KEY: z.string().min(1),
    REFRESH_TOKEN_SECRET: z.string().min(1),

    RAG_SERVICE_URL: z.string().url(),
    AGENT_SERVICE_URL: z.string().url().default("http://localhost:4000"),
    AGENT_SERVICE_API_KEY: z.string().min(1).optional(),

    FRONTEND_ALLOWED_ORIGINS: z
        .string()
        .transform((value) =>
            value
                .split(",")
                .map((origin) => origin.trim())
                .filter(Boolean)
        )
        .pipe(z.array(z.string().url()).min(1)),

    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),

    MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
    NODE_ENV: z.enum(["development", "production", "test"]),

    // Document OCR and ingestion are owned by the user service.
    OCR_PROVIDER: z.enum(["gemini", "groq", "openai"]).default("gemini"),
    GEMINI_OCR_API_KEY: z.string().min(1).optional(),
    GEMINI_OCR_MODEL: z.string().min(1).default("gemini-2.0-flash-exp"),
    GROQ_OCR_API_KEY: z.string().min(1).optional(),
    GROQ_OCR_MODEL: z.string().min(1).default("qwen/qwen-2.5-32b"),
    OPENAI_OCR_API_KEY: z.string().min(1).optional(),
    OPENAI_OCR_MODEL: z.string().min(1).default("gpt-5.4"),
    OPENAI_API_URL: z.string().url().default("https://llmproxy.int.bluecoppertech.com/v1"),

    // Shared PII encryption (must match Agent_backend_service)
    ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),
});

export const env = schema.parse(process.env);

export type Env = z.infer<typeof schema>;
