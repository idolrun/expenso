"use client";

import useSWR from "swr";

import type { FundSummary } from "@/features/funds/domain/types";
import { getFundSummary } from "@/src/features/funds/api/fund-api.client";

export function useFundSummary() {
  const { data, error, isLoading } = useSWR<FundSummary>(
    "/api/funds/summary",
    getFundSummary,
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000,
    },
  );

  return {
    summary: data,
    isLoading,
    error,
  };
}
