import type { DashboardSummaryDto } from "@/features/dashboard/domain/types";

import { apiAxios } from "@/src/lib/axios";
import { assertApiOk } from "@/src/lib/api/unwrap";

export async function fetchDashboardSummary(
  signal?: AbortSignal,
): Promise<DashboardSummaryDto> {
  const res = await apiAxios.get<unknown>("/dashboard", { signal });
  return assertApiOk<DashboardSummaryDto>(res.status, res.data);
}
