import type { GlobalSearchHitDto } from "@/features/expenses/domain/dto";
import type { GlobalSearchQuery } from "@/features/expenses/validation/expense";

import { apiAxios } from "@/src/lib/axios";
import { assertApiOk } from "@/src/lib/api/unwrap";

export async function fetchGlobalSearch(
  query: GlobalSearchQuery,
  signal?: AbortSignal,
): Promise<GlobalSearchHitDto[]> {
  const res = await apiAxios.get<unknown>("/search", {
    params: { q: query.q, limit: query.limit },
    signal,
  });
  return assertApiOk<GlobalSearchHitDto[]>(res.status, res.data);
}
