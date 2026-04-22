import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";

import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/env/public-url";
import { sendMail } from "@/lib/email/send-mail";
import { generateMagicLinkEmail } from "@/lib/email/templates/magic-link";
import { rateLimit } from "@/lib/email/rate-limit";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set and at least 32 characters (generate a random string for production).",
  );
}

/** In development, prefer the browser app origin (default :3001) over a stale BETTER_AUTH_URL (:3000). */
const baseURL =
  process.env.NODE_ENV === "development"
    ? getPublicAppUrl()
    : (process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? getPublicAppUrl());

const trustedOrigins =
  process.env.NODE_ENV === "development"
    ? Array.from(
        new Set([
          getPublicAppUrl(),
          ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [])
            .map((o) => o.trim())
            .filter(Boolean),
        ]),
      )
    : (process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
        .map((o) => o.trim())
        .filter(Boolean) ?? [getPublicAppUrl()]);

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins,
  /** Align generated string ids (session, account, verification, passkey) with PostgreSQL UUID strings. */
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
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
        const normalizedEmail = email.trim().toLowerCase();

        const allowed = await prisma.allowedEmail.findUnique({
          where: { email: normalizedEmail },
        });
        if (!allowed || !allowed.isActive) {
          throw new Error(
            "You are not authorized to access this application.",
          );
        }

        const limit = rateLimit(email, { maxRequests: 3, windowMs: 60_000 });
        if (!limit.ok) {
          throw new Error(
            "Too many login attempts. Please try again in a minute.",
          );
        }

        const { subject, text, html } = generateMagicLinkEmail({ magicLink: url });

        try {
          const result = await sendMail({ to: email, subject, text, html });
          console.info(
            `[auth] Magic link email sent to ${email} (messageId: ${result.messageId})`,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error(`[auth] Failed to send magic link to ${email}:`, message);
          throw new Error(
            "Failed to send login email. Please try again later.",
          );
        }
      },
    }),
  ],
});
