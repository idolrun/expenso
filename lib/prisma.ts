import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// Prisma 7 breaking change: imports must use the custom output path, NOT @prisma/client.
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Prisma 7 breaking change: driver adapters are REQUIRED.
  // PrismaPg now requires a pg.Pool instance, not just a connection string.
  const pool = new Pool({ connectionString });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

let _prisma: PrismaClient | undefined;

/** Lazily-initialized Prisma client. Safe to import in unit tests — it only
 *  tries to connect on first property access (e.g. `prisma.user.findMany`). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!_prisma) {
      _prisma = createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = _prisma;
      }
    }
    const value = _prisma[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(_prisma);
    }
    return value;
  },
});
