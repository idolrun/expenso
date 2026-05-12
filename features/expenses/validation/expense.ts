import { z } from "zod";

import {
  currencyCodeSchema,
  dateYmdSchema,
  expenseRecordIdSchema,
  expenseSectionValues,
  expenseStatusValues,
  moneyStringSchema,
  userRecordIdSchema,
} from "@/features/expenses/validation/primitives";

const recordId = expenseRecordIdSchema;

export const createExpenseSchemaBase = z.object({
  section: z.enum(expenseSectionValues),
  status: z.enum(expenseStatusValues).optional().default("DRAFT"),
  title: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(10_000).optional().nullable(),
  amount: moneyStringSchema,
  currency: currencyCodeSchema,
  fromDate: dateYmdSchema,
  toDate: dateYmdSchema,
  categoryId: recordId.optional().nullable(),
  tagIds: z.array(recordId).max(50).optional().default([]),
  employeeName: z.string().trim().min(1).max(255).optional(),
});

export const createExpenseSchema = createExpenseSchemaBase.superRefine(
  (v, ctx) => {
    if (v.fromDate > v.toDate) {
      ctx.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "End date must be on or after start date.",
      });
    }

    if (v.section === "SALARY") {
      if (!v.employeeName) {
        ctx.addIssue({
          code: "custom",
          path: ["employeeName"],
          message: "Employee name is required for salary expenses.",
        });
      }
    }
  },
);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchemaBase = z.object({
  id: recordId,
  section: z.enum(expenseSectionValues).optional(),
  status: z.enum(expenseStatusValues).optional(),
  title: z.string().trim().min(1).max(500).optional(),
  notes: z.string().trim().max(10_000).optional().nullable(),
  amount: moneyStringSchema.optional(),
  currency: currencyCodeSchema.optional(),
  fromDate: dateYmdSchema.optional(),
  toDate: dateYmdSchema.optional(),
  categoryId: recordId.optional().nullable(),
  tagIds: z.array(recordId).max(50).optional(),
  employeeName: z.string().trim().min(1).max(255).optional(),
});

export const updateExpenseSchema = updateExpenseSchemaBase
  .refine(
    (v) =>
      v.section !== undefined ||
      v.status !== undefined ||
      v.title !== undefined ||
      v.notes !== undefined ||
      v.amount !== undefined ||
      v.currency !== undefined ||
      v.fromDate !== undefined ||
      v.toDate !== undefined ||
      v.categoryId !== undefined ||
      v.tagIds !== undefined ||
      v.employeeName !== undefined,
    { message: "At least one field must be provided to update" },
  )
  .superRefine((v, ctx) => {
    if (v.fromDate && v.toDate && v.fromDate > v.toDate) {
      ctx.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "End date must be on or after start date.",
      });
    }
  });

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const deleteExpenseSchema = z.object({
  id: recordId,
});

export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>;

const sortFieldValues = [
  "createdAt",
  "updatedAt",
  "amount",
  "fromDate",
  "title",
] as const;

/** Normalize `tagIds` from URL / searchParams (string, repeated params, comma lists, merged state). */
export function normalizeTagIdsQueryInput(val: unknown): string[] {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) {
    return val
      .flatMap((item) => String(item).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export const listExpensesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    section: z.enum(expenseSectionValues).optional(),
    status: z.enum(expenseStatusValues).optional(),
    tagIds: z.preprocess(normalizeTagIdsQueryInput, z.array(recordId).max(50)),
    amountMin: z.string().trim().optional(),
    amountMax: z.string().trim().optional(),
    dateRangeStart: dateYmdSchema.optional(),
    dateRangeEnd: dateYmdSchema.optional(),
    createdByEmail: z.string().trim().max(255).optional(),
    updatedByEmail: z.string().trim().max(255).optional(),
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
    if (
      v.amountMin &&
      v.amountMax &&
      Number(v.amountMin) > Number(v.amountMax)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMax"],
        message: "amountMax must be >= amountMin",
      });
    }
    if (
      v.dateRangeStart &&
      v.dateRangeEnd &&
      v.dateRangeStart > v.dateRangeEnd
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dateRangeEnd"],
        message: "dateRangeEnd must be on or after dateRangeStart",
      });
    }
  });

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
