import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Resolve from this service, even when the process is started from the repo root.
loadDotenv({ path: resolve(__dirname, "../.env"), override: false });

const schema = z.object({
  AGENT_SERVICE_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
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

  MODEL_PROVIDER: z.enum(["openai", "groq"]).default("openai"),
  OPENAI_AGENT_API_KEY: z.string().min(1).optional(),
  GROQ_AGENT_API_KEY: z.string().min(1).optional(),
  OPENAI_AGENT_MODEL: z.string().min(1).default("gpt-4o-mini"),
  GROQ_AGENT_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
  GUARDRAILS_ENABLED: z.coerce.boolean().default(true),

  OPENAI_API_KEY: z.string().min(1).optional(),
  ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),

  SERPAPI_KEY: z.string().min(1).optional(),
  GOOGLE_SEARCH_API_KEY: z.string().min(1).optional(),
  GOOGLE_SEARCH_CX: z.string().min(1).optional(),
});

export const env = schema.parse(process.env);

export type Env = z.infer<typeof schema>;
