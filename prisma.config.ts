// Prisma 7 breaking change: environment variables are NOT loaded by default.
// We must explicitly import dotenv/config so .env files are parsed.
import "dotenv/config"

// Prisma 7 breaking change: datasource URL MUST be configured in prisma.config.ts.
// The url, directUrl, shadowDatabaseUrl fields in schema.prisma datasource are DEPRECATED.
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Prisma 7 breaking change: datasource URL is configured HERE, not in schema.prisma.
  // env("DATABASE_URL") is evaluated when Prisma CLI commands run (migrate, studio, etc).
  // At Docker build time we pass a dummy DATABASE_URL inline to satisfy prisma generate.
  datasource: {
    url: env("DATABASE_URL"),
  },
})
