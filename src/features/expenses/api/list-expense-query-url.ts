import {
  listExpensesQuerySchema,
  type ListExpensesQuery,
} from "@/features/expenses/validation/expense";
import { urlSearchParamsToNormalizedRecord } from "@/src/lib/search-params-normalize";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT_FIELD = "createdAt" as const;
const DEFAULT_SORT_DIR = "desc" as const;

export function parseListExpensesQueryFromUrlSearchParams(
  params: URLSearchParams,
):
  | { ok: true; query: ListExpensesQuery }
  | { ok: false; message: string } {
  const raw = urlSearchParamsToNormalizedRecord(params);
  const parsed = listExpensesQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  return { ok: true, query: parsed.data };
}

/** Serializes a normalized list query for `router.replace` / shareable URLs. Omits default fields. */
export function serializeListExpensesQueryToSearchParams(
  query: ListExpensesQuery,
): URLSearchParams {
  const p = new URLSearchParams();

  if (query.page !== DEFAULT_PAGE) p.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) p.set("pageSize", String(query.pageSize));
  if (query.section) p.set("section", query.section);
  if (query.tagIds.length) p.set("tagIds", query.tagIds.join(","));
  if (query.amountMin?.trim()) p.set("amountMin", query.amountMin.trim());
  if (query.amountMax?.trim()) p.set("amountMax", query.amountMax.trim());
  if (query.dateRangeStart) p.set("dateRangeStart", query.dateRangeStart);
  if (query.dateRangeEnd) p.set("dateRangeEnd", query.dateRangeEnd);
  if (query.createdByEmail !== undefined) p.set("createdByEmail", String(query.createdByEmail));
  if (query.updatedByEmail !== undefined) p.set("updatedByEmail", String(query.updatedByEmail));
  if (query.search?.trim()) p.set("search", query.search.trim());
  if (query.sortField !== DEFAULT_SORT_FIELD) p.set("sortField", query.sortField);
  if (query.sortDir !== DEFAULT_SORT_DIR) p.set("sortDir", query.sortDir);

  return p;
}
