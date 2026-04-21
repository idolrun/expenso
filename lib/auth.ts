import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";

import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/env/public-url";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set and at least 32 characters (generate a random string for production).",
  );
}

const baseURL =
  process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? getPublicAppUrl();

const trustedOrigins = (
  process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? [getPublicAppUrl()]
);

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
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
  plugins: [
    nextCookies(),
    passkey({
      rpID: process.env.WEBAUTHN_RP_ID?.trim() || "localhost",
      rpName: process.env.WEBAUTHN_APP_NAME?.trim() || "Expenso",
      origin: process.env.WEBAUTHN_ORIGIN?.trim()
        ? process.env.WEBAUTHN_ORIGIN.trim().replace(/\/$/, "")
        : getPublicAppUrl(),
      registration: {
        requireSession: true,
        extensions: { credProps: true },
      },
      authentication: {
        extensions: { credProps: true },
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (process.env.NODE_ENV !== "production") {
          // Local development: log the full URL so you can complete sign-in without SMTP.
          // Do not enable verbose magic-link logging in production.
          console.info(`[expenso] Magic link for ${email}`);
          console.info(url);
          return;
        }

        if (process.env.MAGIC_LINK_LOG_ONLY === "true") {
          console.warn(
            "[expenso] MAGIC_LINK_LOG_ONLY is enabled; magic link email is not being sent.",
          );
          return;
        }

        throw new Error(
          "Magic link email is not configured for production. Wire sendMagicLink to your mail provider (e.g. Resend, SES) or set MAGIC_LINK_LOG_ONLY=true for non-production-style environments.",
        );
      },
    }),
  ],
});
