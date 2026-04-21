"use client";

import { useCallback, useMemo, useState } from "react";

import type { AuditLogEntryDto, PaginatedDto } from "@/features/expenses/domain/dto";
import {
  auditLogQuerySchema,
  type AuditLogQuery,
} from "@/features/audit/validation/audit-log-query";

import { fetchAuditLogPage } from "@/src/features/audit/api/audit-api.client";
import { useAsyncQuery } from "@/src/lib/use-async-query";

export type UseAuditLogOptions = {
  initialQuery?: Partial<AuditLogQuery>;
};

export function useAuditLog(options?: UseAuditLogOptions) {
  const [query, setQueryState] = useState<AuditLogQuery>(() =>
    auditLogQuerySchema.parse({ ...options?.initialQuery }),
  );

  const setQuery = useCallback((patch: Partial<AuditLogQuery>) => {
    setQueryState((prev) => auditLogQuerySchema.parse({ ...prev, ...patch }));
  }, []);

  const key = useMemo(() => JSON.stringify(query), [query]);

  const asyncState = useAsyncQuery<PaginatedDto<AuditLogEntryDto>>(
    (signal) => fetchAuditLogPage(query, signal),
    key,
  );

  return { ...asyncState, query, setQuery };
}
