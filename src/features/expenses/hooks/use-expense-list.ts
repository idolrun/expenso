"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ExpenseDto, PaginatedDto } from "@/features/expenses/domain/dto";
import {
  listExpensesQuerySchema,
  type ListExpensesQuery,
} from "@/features/expenses/validation/expense";

import { fetchExpenseList } from "@/src/features/expenses/api/expense-api.client";
import {
  parseListExpensesQueryFromUrlSearchParams,
  serializeListExpensesQueryToSearchParams,
} from "@/src/features/expenses/api/list-expense-query-url";
import { useAsyncQuery } from "@/src/lib/use-async-query";
import { useDebouncedValue } from "@/src/lib/use-debounced-value";

export type UseExpenseListOptions = {
  /** Merge on top of URL / defaults when hydrating from the location bar. */
  initialQuery?: Partial<ListExpensesQuery>;
  /** Keep filters in the location bar; reacts to browser navigation. */
  syncUrl?: boolean;
  debounceSearchMs?: number;
};

function readQueryFromSearchParams(
  searchParams: URLSearchParams,
  initial?: Partial<ListExpensesQuery>,
): ListExpensesQuery {
  const parsed = parseListExpensesQueryFromUrlSearchParams(searchParams);
  const base = parsed.ok ? parsed.query : listExpensesQuerySchema.parse({});
  return listExpensesQuerySchema.parse({ ...base, ...initial });
}

export function useExpenseList(options?: UseExpenseListOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncUrl = options?.syncUrl ?? false;
  const debounceMs = options?.debounceSearchMs ?? 350;

  /** Parents often pass inline objects; stabilize effect deps by value (not reference). */
  const initialOverlayJson = JSON.stringify(options?.initialQuery ?? {});
  const initialOverlayRef = useRef(options?.initialQuery);
  initialOverlayRef.current = options?.initialQuery;

  const lastHandledQs = useRef<string | null>(null);

  const [query, setQueryState] = useState<ListExpensesQuery>(() =>
    readQueryFromSearchParams(new URLSearchParams(searchParams.toString()), options?.initialQuery),
  );

  /** Hydrate from URL on real navigation (back/forward / external), not our own router.replace echo. */
  useEffect(() => {
    if (!syncUrl) return;
    const cur = searchParams.toString();
    if (lastHandledQs.current === cur) return;
    lastHandledQs.current = cur;
    setQueryState(
      readQueryFromSearchParams(
        new URLSearchParams(searchParams.toString()),
        initialOverlayRef.current,
      ),
    );
  }, [searchParams, syncUrl, initialOverlayJson]);

  const setQuery = useCallback((patch: Partial<ListExpensesQuery>) => {
    setQueryState((prev) => {
      const parsed = listExpensesQuerySchema.safeParse({ ...prev, ...patch });
      return parsed.success ? parsed.data : prev;
    });
  }, []);

  const debouncedSearch = useDebouncedValue(query.search ?? "", debounceMs);

  const fetchQuery = useMemo(
    () =>
      listExpensesQuerySchema.parse({
        ...query,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      }),
    [query, debouncedSearch],
  );

  const fetchKey = useMemo(() => JSON.stringify(fetchQuery), [fetchQuery]);

  const asyncState = useAsyncQuery<PaginatedDto<ExpenseDto>>(
    (signal) => fetchExpenseList(fetchQuery, signal),
    fetchKey,
  );

  useEffect(() => {
    if (!syncUrl) return;
    const next = serializeListExpensesQueryToSearchParams(fetchQuery).toString();
    const cur = searchParams.toString();
    if (next === cur) return;
    lastHandledQs.current = next;
    router.replace(next.length ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [fetchQuery, syncUrl, pathname, router, searchParams]);

  return {
    ...asyncState,
    query,
    fetchQuery,
    setQuery,
    /** Bind search inputs here; list fetch uses debounced value via fetchQuery. */
    searchInput: query.search ?? "",
    setSearch: (value: string) => {
      setQueryState((prev) => listExpensesQuerySchema.parse({ ...prev, search: value || undefined }));
    },
  };
}
