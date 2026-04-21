import { z } from "zod";

import {
  currencyCodeSchema,
  dateYmdSchema,
  expenseRecordIdSchema,
  expenseSectionValues,
  expenseStatusValues,
  moneyStringSchema,
} from "@/features/expenses/validation/primitives";

const recordId = expenseRecordIdSchema;

export const createExpenseSchema = z.object({
  section: z.enum(expenseSectionValues),
  status: z.enum(expenseStatusValues).optional().default("DRAFT"),
  title: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(10_000).optional().nullable(),
  amount: moneyStringSchema,
  currency: currencyCodeSchema,
  incurredOn: dateYmdSchema,
  categoryId: recordId.optional().nullable(),
  tagIds: z.array(recordId).max(50).optional().default([]),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z
  .object({
    id: recordId,
    section: z.enum(expenseSectionValues).optional(),
    status: z.enum(expenseStatusValues).optional(),
    title: z.string().trim().min(1).max(500).optional(),
    notes: z.string().trim().max(10_000).optional().nullable(),
    amount: moneyStringSchema.optional(),
    currency: currencyCodeSchema.optional(),
    incurredOn: dateYmdSchema.optional(),
    categoryId: recordId.optional().nullable(),
    tagIds: z.array(recordId).max(50).optional(),
  })
  .refine(
    (v) =>
      v.section !== undefined ||
      v.status !== undefined ||
      v.title !== undefined ||
      v.notes !== undefined ||
      v.amount !== undefined ||
      v.currency !== undefined ||
      v.incurredOn !== undefined ||
      v.categoryId !== undefined ||
      v.tagIds !== undefined,
    { message: "At least one field must be provided to update" },
  );

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const deleteExpenseSchema = z.object({
  id: recordId,
});

export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>;

const sortFieldValues = [
  "createdAt",
  "updatedAt",
  "amount",
  "incurredOn",
  "title",
] as const;

export const listExpensesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    section: z.enum(expenseSectionValues).optional(),
    status: z.enum(expenseStatusValues).optional(),
    tagIds: z
      .string()
      .optional()
      .transform((s) =>
        s
          ? s
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      )
      .pipe(z.array(recordId).max(50)),
    amountMin: z.string().trim().optional(),
    amountMax: z.string().trim().optional(),
    incurredOnFrom: dateYmdSchema.optional(),
    incurredOnTo: dateYmdSchema.optional(),
    createdById: z.coerce.number().int().positive().optional(),
    updatedById: z.coerce.number().int().positive().optional(),
    search: z.string().trim().max(200).optional(),
    sortField: z.enum(sortFieldValues).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  })
  .superRefine((v, ctx) => {
    if (v.amountMin && !/^\d+(\.\d{1,4})?$/.test(v.amountMin)) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMin"],
        message: "Invalid decimal",
      });
    }
    if (v.amountMax && !/^\d+(\.\d{1,4})?$/.test(v.amountMax)) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMax"],
        message: "Invalid decimal",
      });
    }
    if (v.amountMin && v.amountMax && Number(v.amountMin) > Number(v.amountMax)) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMax"],
        message: "amountMax must be >= amountMin",
      });
    }
    if (v.incurredOnFrom && v.incurredOnTo && v.incurredOnFrom > v.incurredOnTo) {
      ctx.addIssue({
        code: "custom",
        path: ["incurredOnTo"],
        message: "incurredOnTo must be on or after incurredOnFrom",
      });
    }
  });

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
