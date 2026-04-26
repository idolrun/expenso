import type { CredentialEntryRecord, CredentialHistoryRecord } from "@/features/credentials/domain/types";

import { apiAxios } from "@/src/lib/axios";
import { assertApiOk } from "@/src/lib/api/unwrap";

export type CredentialListFilters = {
  isActive?: boolean;
  authMethod?: string;
  search?: string;
};

function toSearchParams(filters: CredentialListFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.isActive !== undefined) p.set("isActive", String(filters.isActive));
  if (filters.authMethod?.trim()) p.set("authMethod", filters.authMethod.trim());
  if (filters.search?.trim()) p.set("search", filters.search.trim());
  return p;
}

export async function fetchCredentialList(
  filters: CredentialListFilters = {},
  signal?: AbortSignal,
): Promise<CredentialEntryRecord[]> {
  const res = await apiAxios.get<unknown>("/credentials", {
    params: toSearchParams(filters),
    signal,
  });
  return assertApiOk<CredentialEntryRecord[]>(res.status, res.data);
}

export async function fetchCredentialById(
  id: string,
  signal?: AbortSignal,
): Promise<CredentialEntryRecord> {
  const res = await apiAxios.get<unknown>(
    `/credentials/${encodeURIComponent(id)}`,
    { signal },
  );
  return assertApiOk<CredentialEntryRecord>(res.status, res.data);
}

export async function fetchCredentialHistory(
  id: string,
  signal?: AbortSignal,
): Promise<CredentialHistoryRecord[]> {
  const res = await apiAxios.get<unknown>(
    `/credentials/${encodeURIComponent(id)}/history`,
    { signal },
  );
  return assertApiOk<CredentialHistoryRecord[]>(res.status, res.data);
}
