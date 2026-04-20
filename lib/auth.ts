import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
export const auth = betterAuth({
  advanced: {
    database: {
      generateId: (options) => {
        if (options.model === "user" || options.model === "users") {
          return false;
        }
        return crypto.randomUUID();
      },
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
});