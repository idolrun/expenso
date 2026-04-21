"use client";

import type { ExpenseDto } from "@/features/expenses/domain/dto";

import { fetchExpenseById } from "@/src/features/expenses/api/expense-api.client";
import { useAsyncQuery } from "@/src/lib/use-async-query";

export function useExpenseDetails(expenseId: string | null | undefined) {
  const id = expenseId?.trim() ?? "";
  const enabled = id.length > 0;

  const asyncState = useAsyncQuery<ExpenseDto>(
    (signal) => fetchExpenseById(id, signal),
    id,
    { enabled },
  );

  return { ...asyncState, expenseId: id, enabled };
}
