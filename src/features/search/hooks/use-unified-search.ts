"use client";

import { useEffect, useState } from "react";

import type { UnifiedSearchResult, UnifiedSearchQuery } from "@/features/search/domain/types";
import { fetchUnifiedSearch } from "@/src/features/search/api/unified-search-api.client";
import type { ApiHttpError } from "@/src/lib/api/api-error";
import { toApiHttpError } from "@/src/lib/api/to-api-http-error";
import { useDebouncedValue } from "@/src/lib/use-debounced-value";

export type UseUnifiedSearchOptions = {
  debounceMs?: number;
  limit?: number;
};

export function useUnifiedSearch(options?: UseUnifiedSearchOptions) {
  const debounceMs = options?.debounceMs ?? 280;
  const limit = options?.limit ?? 25;

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, debounceMs);

  const [data, setData] = useState<UnifiedSearchResult>({ query: "", hits: [], actions: [] });
  const [error, setError] = useState<ApiHttpError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const needle = debouncedQ.trim();
    if (needle.length < 2) {
      queueMicrotask(() => {
        setData({ query: needle, hits: [], actions: [] });
        setError(null);
        setIsLoading(false);
      });
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      setIsLoading(true);
      setError(null);
    });

    fetchUnifiedSearch({ q: needle, limit }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setData({ query: needle, hits: [], actions: [] });
        setError(toApiHttpError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQ, limit]);

  const retry = async () => {
    const needle = debouncedQ.trim();
    if (needle.length < 2) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchUnifiedSearch({ q: needle, limit });
      setData(result);
    } catch (e) {
      setError(toApiHttpError(e));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    q,
    setQ,
    debouncedQ,
    data,
    error,
    isLoading,
    isEmpty:
      data.hits.length === 0 &&
      data.actions.length === 0 &&
      debouncedQ.trim().length >= 2 &&
      !isLoading &&
      !error,
    retry,
  };
}
