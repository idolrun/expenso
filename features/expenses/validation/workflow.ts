import { z } from "zod";
import { expenseRecordIdSchema } from "@/features/expenses/validation/primitives";

const recordId = expenseRecordIdSchema;

export const submitForApprovalSchema = z.object({
  id: recordId,
});

export const approveExpenseSchema = z.object({
  id: recordId,
  comment: z.string().trim().max(2000).optional(),
});

export const rejectExpenseSchema = z.object({
  id: recordId,
  comment: z.string().trim().max(2000).optional(),
});

export const payExpenseSchema = z.object({
  id: recordId,
});

export const cancelExpenseSchema = z.object({
  id: recordId,
});

export type SubmitForApprovalInput = z.infer<typeof submitForApprovalSchema>;
export type ApproveExpenseInput = z.infer<typeof approveExpenseSchema>;
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;
export type PayExpenseInput = z.infer<typeof payExpenseSchema>;
export type CancelExpenseInput = z.infer<typeof cancelExpenseSchema>;
