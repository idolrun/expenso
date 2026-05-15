import { z } from "zod";
import { expenseRecordIdSchema } from "@/features/expenses/validation/primitives";

const recordId = expenseRecordIdSchema;

export const payExpenseSchema = z.object({
  id: recordId,
});

export const cancelExpenseSchema = z.object({
  id: recordId,
});

export type PayExpenseInput = z.infer<typeof payExpenseSchema>;
export type CancelExpenseInput = z.infer<typeof cancelExpenseSchema>;
