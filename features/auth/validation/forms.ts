import { z } from "zod";

export const magicLinkEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

/** Optional query params on `/sign-in` from auth redirects. */
export const signInSearchParamsSchema = z.object({
  error: z.string().max(500).optional(),
  message: z.string().max(2000).optional(),
});
