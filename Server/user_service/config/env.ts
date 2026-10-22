// src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const schema = z.object({
    // Node Backend Service
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    DATABASE_URL: z.string().url(),

    JWT_SECRET_KEY: z.string().min(1),
    REFRESH_TOKEN_SECRET: z.string().min(1),

    RAG_SERVICE_URL: z.string().url(),
    AGENT_SERVICE_URL: z.string().url().default("http://localhost:4001"),
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

    // OCR / Text Extraction
    OCR_PROVIDER: z.enum(["gemini", "groq", "openai"]).optional().default("gemini"),
    GEMINI_OCR_API_KEY: z.string().min(1).optional(),
    GEMINI_OCR_MODEL: z.string().min(1).optional().default("gemini-2.0-flash-exp"),
    GROQ_OCR_API_KEY: z.string().min(1).optional(),
    GROQ_OCR_MODEL: z.string().min(1).optional().default("qwen/qwen-2.5-32b"),
    OPENAI_OCR_API_KEY: z.string().min(1).optional(),
    OPENAI_OCR_MODEL: z.string().min(1).optional().default("gpt-4o-2024-11-20"),

    // Shared PII encryption (must match Agent_backend_service)
    ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),
});

export const env = schema.parse(process.env);

export type Env = z.infer<typeof schema>;
