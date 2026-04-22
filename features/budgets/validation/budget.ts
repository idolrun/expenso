import { z } from "zod";

import type { BudgetPeriod, ExpenseSection } from "@/app/generated/prisma/client";
import { expenseCurrencyValues } from "@/features/expenses/domain/currency";
import {
  dateYmdSchema,
  expenseSectionValues,
  moneyStringSchema,
} from "@/features/expenses/validation/primitives";
import { budgetPeriodValues } from "@/features/budgets/domain/types";

export const budgetPeriodSchema = z.enum([...budgetPeriodValues] as [
  BudgetPeriod,
  ...BudgetPeriod[],
]);

export const budgetCurrencySchema = z.enum([...expenseCurrencyValues] as [
  string,
  ...string[],
]);

export const budgetSectionSchema = z.enum([...expenseSectionValues] as [
  ExpenseSection,
  ...ExpenseSection[],
]);

export const createSectionBudgetSchema = z
  .object({
    section: budgetSectionSchema,
    period: budgetPeriodSchema,
    budgetCurrency: budgetCurrencySchema,
    budgetAmount: moneyStringSchema,
    periodStart: dateYmdSchema,
    periodEnd: dateYmdSchema,
    notes: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((v) => v.periodStart <= v.periodEnd, {
    message: "periodEnd must be on or after periodStart",
    path: ["periodEnd"],
  });

export type CreateSectionBudgetSchemaInput = z.infer<
  typeof createSectionBudgetSchema
>;

export const updateSectionBudgetSchema = z
  .object({
    id: z.string().uuid(),
    budgetCurrency: budgetCurrencySchema.optional(),
    budgetAmount: moneyStringSchema.optional(),
    periodEnd: dateYmdSchema.optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(5000).optional().nullable(),
  })
  .refine(
    (v) =>
      v.budgetCurrency !== undefined ||
      v.budgetAmount !== undefined ||
      v.periodEnd !== undefined ||
      v.isActive !== undefined ||
      v.notes !== undefined,
    { message: "At least one field must be provided to update" },
  );

export type UpdateSectionBudgetSchemaInput = z.infer<
  typeof updateSectionBudgetSchema
>;

export const listSectionBudgetsQuerySchema = z.object({
  section: budgetSectionSchema.optional(),
  period: budgetPeriodSchema.optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSectionBudgetsQuery = z.infer<
  typeof listSectionBudgetsQuerySchema
>;

export const budgetSummaryQuerySchema = z.object({
  section: budgetSectionSchema,
  displayCurrency: budgetCurrencySchema.default("USD"),
  /** Optional: if omitted, defaults to current date. */
  referenceDate: dateYmdSchema.optional(),
});

export type BudgetSummaryQuery = z.infer<typeof budgetSummaryQuerySchema>;
