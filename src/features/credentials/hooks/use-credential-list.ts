"use client";

import { useMemo } from "react";

import type { CredentialEntryRecord } from "@/features/credentials/domain/types";

import { fetchCredentialList } from "@/src/features/credentials/api/credential-api.client";
import { useAsyncQuery } from "@/src/lib/use-async-query";

export type CredentialListFilters = {
  isActive?: boolean;
  authMethod?: string;
  search?: string;
};

export function useCredentialList(filters: CredentialListFilters = {}) {
  const key = useMemo(
    () => JSON.stringify(filters),
    [filters],
  );

  return useAsyncQuery<CredentialEntryRecord[]>(
    (signal) => fetchCredentialList(filters, signal),
    key,
  );
}
