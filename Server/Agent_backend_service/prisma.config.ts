import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

loadDotenv({ path: resolve(__dirname, ".env"), override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
