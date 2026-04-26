import type { CreateCredentialDTO } from "@/features/credentials/validation/credential";
import type { CredentialEntryRecord } from "@/features/credentials/domain/types";

export function buildHistoryRecords(
  before: CredentialEntryRecord,
  after: Partial<CreateCredentialDTO>,
  changedById: string,
): Array<{
  entryId: string;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedById: string;
}> {
  const records: Array<{
    entryId: string;
    fieldKey: string;
    oldValue: unknown;
    newValue: unknown;
    changedById: string;
  }> = [];

  const trackedFields: (keyof CreateCredentialDTO)[] = [
    "appName",
    "appUrl",
    "loginEmail",
    "password",
    "authMethod",
    "twoFactorSecret",
    "notes",
  ];

  for (const field of trackedFields) {
    if (after[field] === undefined) continue;
    const oldValue = before[field];
    const newValue = after[field] ?? null;
    if (oldValue === newValue) continue;
    records.push({
      entryId: before.id,
      fieldKey: field,
      oldValue,
      newValue,
      changedById,
    });
  }

  return records;
}
