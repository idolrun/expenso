import { z } from "zod";

export const allowedEmailRecordIdSchema = z.string().uuid();

export const createAllowedEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email address"),
  note: z.string().trim().max(255, "Note must be 255 characters or less").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateAllowedEmailSchema = z.object({
  id: allowedEmailRecordIdSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email address"),
  note: z.string().trim().max(255, "Note must be 255 characters or less").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export const deleteAllowedEmailSchema = z.object({
  id: allowedEmailRecordIdSchema,
});

export type CreateAllowedEmailInput = z.infer<typeof createAllowedEmailSchema>;
export type UpdateAllowedEmailInput = z.infer<typeof updateAllowedEmailSchema>;
export type DeleteAllowedEmailInput = z.infer<typeof deleteAllowedEmailSchema>;
