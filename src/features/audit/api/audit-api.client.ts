import type { AuditLogEntryDto, PaginatedDto } from "@/features/expenses/domain/dto";
import type { AuditLogQuery } from "@/features/audit/validation/audit-log-query";

import { apiAxios } from "@/src/lib/axios";
import { assertApiOk } from "@/src/lib/api/unwrap";

function toSearchParams(query: AuditLogQuery): URLSearchParams {
  const p = new URLSearchParams();
  p.set("page", String(query.page));
  p.set("pageSize", String(query.pageSize));
  if (query.action) p.set("action", query.action);
  if (query.entityType?.trim()) p.set("entityType", query.entityType.trim());
  return p;
}

export async function fetchAuditLogPage(
  query: AuditLogQuery,
  signal?: AbortSignal,
): Promise<PaginatedDto<AuditLogEntryDto>> {
  const res = await apiAxios.get<unknown>("/audit-log", {
    params: toSearchParams(query),
    signal,
  });
  return assertApiOk<PaginatedDto<AuditLogEntryDto>>(res.status, res.data);
}
