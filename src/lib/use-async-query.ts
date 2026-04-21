"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiHttpError } from "@/src/lib/api/api-error";
import { toApiHttpError } from "@/src/lib/api/to-api-http-error";

export type AsyncQueryState<T> = {
  data: T | null;
  error: ApiHttpError | null;
  isLoading: boolean;
  /** True when the last successful payload was empty (e.g. zero rows). */
  isEmpty: boolean;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
};

export type UseAsyncQueryOptions = {
  /** When false, skips network and returns idle empty state. */
  enabled?: boolean;
};

function isEmptyPayload<T>(data: T): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object" && "items" in data) {
    const items = (data as { items: unknown }).items;
    if (Array.isArray(items)) return items.length === 0;
  }
  return false;
}

/**
 * Async read with abort when `depsKey` changes, plus refetch/retry.
 * Pass a stable `depsKey` (e.g. JSON.stringify(query)) so dependencies are explicit.
 */
export function useAsyncQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  depsKey: string,
  options?: UseAsyncQueryOptions,
): AsyncQueryState<T> {
  const enabled = options?.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiHttpError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isEmpty, setIsEmpty] = useState(false);
  const generation = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async (signal: AbortSignal) => {
    const gen = ++generation.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(signal);
      if (signal.aborted || generation.current !== gen) return;
      setData(result);
      setIsEmpty(isEmptyPayload(result));
    } catch (e) {
      if (signal.aborted || generation.current !== gen) return;
      setData(null);
      setIsEmpty(false);
      setError(toApiHttpError(e));
    } finally {
      if (!signal.aborted && generation.current === gen) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      generation.current += 1;
      queueMicrotask(() => {
        setData(null);
        setError(null);
        setIsEmpty(false);
        setIsLoading(false);
      });
      return;
    }
    const controller = new AbortController();
    queueMicrotask(() => {
      void run(controller.signal);
    });
    return () => controller.abort();
  }, [enabled, depsKey, run]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const controller = new AbortController();
    await run(controller.signal);
  }, [enabled, run]);

  return { data, error, isLoading, isEmpty, refetch, retry: refetch };
}
