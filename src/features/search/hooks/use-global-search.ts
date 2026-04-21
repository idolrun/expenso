"use client";

import { useEffect, useState } from "react";

import type { GlobalSearchHitDto } from "@/features/expenses/domain/dto";

import { fetchGlobalSearch } from "@/src/features/search/api/search-api.client";
import type { ApiHttpError } from "@/src/lib/api/api-error";
import { toApiHttpError } from "@/src/lib/api/to-api-http-error";
import { useDebouncedValue } from "@/src/lib/use-debounced-value";

export type UseGlobalSearchOptions = {
  debounceMs?: number;
  limit?: number;
};

export function useGlobalSearch(options?: UseGlobalSearchOptions) {
  const debounceMs = options?.debounceMs ?? 300;
  const limit = options?.limit ?? 25;

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, debounceMs);

  const [data, setData] = useState<GlobalSearchHitDto[]>([]);
  const [error, setError] = useState<ApiHttpError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const needle = debouncedQ.trim();
    if (needle.length < 2) {
      queueMicrotask(() => {
        setData([]);
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

    fetchGlobalSearch({ q: needle, limit }, controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setData(rows);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setData([]);
        setError(toApiHttpError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQ, limit]);

  return {
    q,
    setQ,
    debouncedQ,
    data,
    error,
    isLoading,
    isEmpty: data.length === 0 && debouncedQ.trim().length >= 2 && !isLoading && !error,
    refetch: async () => {
      const needle = debouncedQ.trim();
      if (needle.length < 2) return;
      setIsLoading(true);
      setError(null);
      try {
        const rows = await fetchGlobalSearch({ q: needle, limit });
        setData(rows);
      } catch (e) {
        setError(toApiHttpError(e));
      } finally {
        setIsLoading(false);
      }
    },
    retry: async () => {
      const needle = debouncedQ.trim();
      if (needle.length < 2) return;
      setIsLoading(true);
      setError(null);
      try {
        const rows = await fetchGlobalSearch({ q: needle, limit });
        setData(rows);
      } catch (e) {
        setError(toApiHttpError(e));
      } finally {
        setIsLoading(false);
      }
    },
  };
}
