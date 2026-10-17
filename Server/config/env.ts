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

    // RAG Service
    PINECONE_API_KEY: z.string().min(1),
    GROQ_API_KEY: z.string().min(1),
    HUGGINGFACEHUB_API_TOKEN: z.string().min(1),

    BACKEND_ALLOWED_ORIGINS: z
        .string()
        .transform((value) =>
            value
                .split(",")
                .map((origin) => origin.trim())
                .filter(Boolean)
        )
        .pipe(z.array(z.string().url()).min(1)),

    // Agent System (optional — only needed when agent features are enabled)
    OPENAI_API_KEY: z.string().min(1).optional(),
    ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),
    SERPAPI_KEY: z.string().min(1).optional(),
    GOOGLE_SEARCH_API_KEY: z.string().min(1).optional(),
    GOOGLE_SEARCH_CX: z.string().min(1).optional(),
});

export const env = schema.parse(process.env);

export type Env = z.infer<typeof schema>;
