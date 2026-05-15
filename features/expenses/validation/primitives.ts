import { z } from "zod";

import type { ExpenseSection } from "@/generated/prisma/client";
import { expenseCurrencyValues } from "@/features/expenses/domain/currency";

export const expenseSectionValues = [
  "OVERVIEW",
  "TECH",
  "MARKETING",
  "SOCIAL_MEDIA",
  "PETTY_CASH",
  "SALARY",
  "TRAVEL",
] as const satisfies readonly ExpenseSection[];

export const paymentTypeValues = [
  "CASH",
  "BANK_TRANSFER",
  "CHEQUE",
  "MOBILE_WALLET",
  "CARD",
  "OTHER",
] as const;

export const expenseSectionSchema = z.enum(expenseSectionValues);
export const expenseCurrencySchema = z.enum(expenseCurrencyValues);
export const paymentTypeSchema = z.enum(paymentTypeValues);

export const moneyStringSchema = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,4})?$/,
    "Amount must be a positive decimal with up to 4 fractional digits",
  )
  .refine((v) => Number(v) > 0, "Amount must be greater than zero");

/** Prisma expense ids (cuid). */
export const expenseRecordIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(36)
  .regex(/^[a-z0-9_-]+$/i, "Invalid id format");

/** Prisma `User.id` (PostgreSQL UUID, Better Auth session `user.id`). */
export const userRecordIdSchema = z.string().uuid();

export const dateYmdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for dates");

export const currencyCodeSchema = z
  .string()
  .trim()
  .transform((c) => c.toUpperCase())
  .pipe(expenseCurrencySchema);
