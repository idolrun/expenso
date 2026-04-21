"use client";

import type { DashboardSummaryDto } from "@/features/dashboard/domain/types";

import { fetchDashboardSummary } from "@/src/features/dashboard/api/dashboard-api.client";
import { useAsyncQuery } from "@/src/lib/use-async-query";

export function useDashboardData() {
  return useAsyncQuery<DashboardSummaryDto>(
    (signal) => fetchDashboardSummary(signal),
    "dashboard",
  );
}
