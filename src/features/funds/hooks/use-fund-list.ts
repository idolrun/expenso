"use client";

import { useMemo } from "react";
import useSWR from "swr";

import type { FundEntryRecord } from "@/features/funds/domain/types";
import type { FundListQueryDTO } from "@/features/funds/validation/fund";
import { getFundEntries } from "@/src/features/funds/api/fund-api.client";

export function useFundList(filters: Partial<FundListQueryDTO> = {}) {
  const serializedFilters = useMemo(() => JSON.stringify(filters), [filters]);

  const key = useMemo(
    () => ["/api/funds", serializedFilters] as const,
    [serializedFilters],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async ([, serialized]) => {
      const parsedFilters = JSON.parse(serialized) as Partial<FundListQueryDTO>;
      return getFundEntries(parsedFilters);
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    entries: (data?.entries ?? []) as FundEntryRecord[],
    total: data?.total ?? 0,
    isLoading,
    isValidating,
    error,
    mutate: () => {
      void mutate();
    },
  };
}
