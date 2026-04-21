import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { passkey } from "@better-auth/passkey"
import { magicLink } from "better-auth/plugins";  

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
  plugins: [
    passkey({
      registration: {
        // Default: true. Set false for passkey-first onboarding.
        requireSession: false,
        // Required if requireSession is false and no session exists.
        resolveUser: async ({ ctx, context }) => {
          // Validate context (e.g., a signed token), then create or load a user.
          return { id: "user-id", name: "user@example.com" }
        },
        // Optional server-defined extensions
        extensions: { credProps: true },
      },
      authentication: {
        // Optional server-defined extensions
        extensions: { credProps: true },
      },
    }), 
    magicLink({ 
      sendMagicLink: async ({ email, token, url, metadata }, ctx) => { 
          // send email to user
        } 
    }), 
  ]
});