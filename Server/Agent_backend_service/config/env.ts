import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string().url(),

  AGENT_SERVICE_API_KEY: z.string().min(1).optional(),
  AGENT_ALLOWED_ORIGINS: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().url()).min(1))
    .optional(),

  RAG_SERVICE_URL: z.string().url().default("http://localhost:8000"),

  MODEL_PROVIDER: z.enum(["openai", "groq"]).optional().default("openai"),
  OPENAI_AGENT_API_KEY: z.string().min(1).optional(),
  GROQ_AGENT_API_KEY: z.string().min(1).optional(),
  OPENAI_AGENT_MODEL: z.string().min(1).optional().default("gpt-4o"),
  GROQ_AGENT_MODEL: z.string().min(1).optional().default("qwen/qwen-2-7b"),
  GUARDRAILS_ENABLED: z.coerce.boolean().optional().default(true),

  OPENAI_API_KEY: z.string().min(1).optional(),
  ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),

  SERPAPI_KEY: z.string().min(1).optional(),
  GOOGLE_SEARCH_API_KEY: z.string().min(1).optional(),
  GOOGLE_SEARCH_CX: z.string().min(1).optional(),
});

export const env = schema.parse(process.env);

export type Env = z.infer<typeof schema>;
