import { defineConfig } from "prisma/config"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL environment variable is required in production")
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(databaseUrl && {
    datasource: {
      url: databaseUrl,
    },
  }),
})
