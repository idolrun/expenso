import type { UnifiedSearchResult, UnifiedSearchQuery } from "@/features/search/domain/types";
import { apiAxios } from "@/src/lib/axios";
import { assertApiOk } from "@/src/lib/api/unwrap";

export async function fetchUnifiedSearch(
  query: UnifiedSearchQuery,
  signal?: AbortSignal,
): Promise<UnifiedSearchResult> {
  const res = await apiAxios.get<unknown>("/search/unified", {
    params: { q: query.q, limit: query.limit ?? 25 },
    signal,
  });
  return assertApiOk<UnifiedSearchResult>(res.status, res.data);
}
