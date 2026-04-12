import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv();

const fallbackUrl = "postgresql://user:pass@localhost:5432/db";
const prismaUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || fallbackUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaUrl,
  },
});
