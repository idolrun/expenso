import type { ExpenseDto, PaginatedDto } from "@/features/expenses/domain/dto";
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";

import { apiAxios } from "@/src/lib/axios";
import { assertApiOk } from "@/src/lib/api/unwrap";

function toSearchParams(query: ListExpensesQuery): URLSearchParams {
  const p = new URLSearchParams();
  p.set("page", String(query.page));
  p.set("pageSize", String(query.pageSize));
  if (query.section) p.set("section", query.section);
  if (query.status) p.set("status", query.status);
  if (query.tagIds.length) p.set("tagIds", query.tagIds.join(","));
  if (query.amountMin?.trim()) p.set("amountMin", query.amountMin.trim());
  if (query.amountMax?.trim()) p.set("amountMax", query.amountMax.trim());
  if (query.incurredOnFrom) p.set("incurredOnFrom", query.incurredOnFrom);
  if (query.incurredOnTo) p.set("incurredOnTo", query.incurredOnTo);
  if (query.createdById !== undefined) p.set("createdById", String(query.createdById));
  if (query.updatedById !== undefined) p.set("updatedById", String(query.updatedById));
  if (query.search?.trim()) p.set("search", query.search.trim());
  p.set("sortField", query.sortField);
  p.set("sortDir", query.sortDir);
  return p;
}

export async function fetchExpenseList(
  query: ListExpensesQuery,
  signal?: AbortSignal,
): Promise<PaginatedDto<ExpenseDto>> {
  const res = await apiAxios.get<unknown>("/expenses", {
    params: toSearchParams(query),
    signal,
  });
  return assertApiOk<PaginatedDto<ExpenseDto>>(res.status, res.data);
}

export async function fetchExpenseById(
  id: string,
  signal?: AbortSignal,
): Promise<ExpenseDto> {
  const res = await apiAxios.get<unknown>(`/expenses/${encodeURIComponent(id)}`, {
    signal,
  });
  return assertApiOk<ExpenseDto>(res.status, res.data);
}
