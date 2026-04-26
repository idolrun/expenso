"use client";

import type { CredentialHistoryRecord } from "@/features/credentials/domain/types";

import { fetchCredentialHistory } from "@/src/features/credentials/api/credential-api.client";
import { useAsyncQuery } from "@/src/lib/use-async-query";

export function useCredentialHistory(entryId: string | null | undefined) {
  const id = entryId?.trim() ?? "";
  const enabled = id.length > 0;

  const asyncState = useAsyncQuery<CredentialHistoryRecord[]>(
    (signal) => fetchCredentialHistory(id, signal),
    id,
    { enabled },
  );

  return { ...asyncState, entryId: id, enabled };
}
