import { z } from "zod";

export const credentialAuthMethodValues = [
  "EMAIL_PASSWORD",
  "OAUTH_GOOGLE",
  "OAUTH_GITHUB",
  "OAUTH_MICROSOFT",
  "OAUTH_OTHER",
  "MAGIC_LINK",
  "PASSKEY",
  "TWO_FACTOR_EMAIL_PASSWORD",
  "TWO_FACTOR_EMAIL_APP",
  "SSO",
  "OTHER",
] as const;

export const createCredentialSchema = z
  .object({
    appName: z.string().min(1, "App name is required").max(100),
    appUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    loginEmail: z.string().email("Must be a valid email"),
    password: z.string().optional(),
    authMethod: z.enum(credentialAuthMethodValues),
    twoFactorSecret: z.string().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.authMethod === "EMAIL_PASSWORD") {
        return typeof data.password === "string" && data.password.trim().length > 0;
      }
      return true;
    },
    {
      message: "Password is required for Email + Password",
      path: ["password"],
    },
  );

export const updateCredentialSchema = z
  .object({
    id: z.string().cuid(),
    appName: z.string().min(1, "App name is required").max(100).optional(),
    appUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).optional(),
    loginEmail: z.string().email("Must be a valid email").optional(),
    password: z.string().optional(),
    authMethod: z.enum(credentialAuthMethodValues).optional(),
    twoFactorSecret: z.string().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.authMethod === "EMAIL_PASSWORD" && data.password !== undefined) {
        return data.password.trim().length > 0;
      }
      return true;
    },
    {
      message: "Password cannot be empty",
      path: ["password"],
    },
  );

export const disableCredentialSchema = z.object({ id: z.string().cuid() });
export const reEnableCredentialSchema = z.object({ id: z.string().cuid() });

export type CreateCredentialDTO = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialDTO = z.infer<typeof updateCredentialSchema>;
