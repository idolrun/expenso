import type { Prisma } from "@/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";
import type { CredentialHistoryRecord } from "@/features/credentials/domain/types";

const historyInclude = {
  changedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CredentialHistoryInclude;

function toRecord(
  row: Prisma.CredentialHistoryGetPayload<{ include: typeof historyInclude }>,
): CredentialHistoryRecord {
  return {
    id: row.id,
    entryId: row.entryId,
    fieldKey: row.fieldKey,
    oldValue: row.oldValue,
    newValue: row.newValue,
    changedById: row.changedById,
    changedBy: row.changedBy,
    changedAt: row.changedAt,
  };
}

export const credentialHistoryRepository = {
  async createMany(
    db: DbClient,
    records: Array<{
      entryId: string;
      fieldKey: string;
      oldValue: unknown;
      newValue: unknown;
      changedById: string;
    }>,
  ): Promise<void> {
    if (!records.length) return;
    await db.credentialHistory.createMany({
      data: records.map((r) => ({
        entryId: r.entryId,
        fieldKey: r.fieldKey,
        oldValue: r.oldValue as Prisma.InputJsonValue,
        newValue: r.newValue as Prisma.InputJsonValue,
        changedById: r.changedById,
      })),
    });
  },

  async findLastFiveByEntryId(
    db: DbClient,
    entryId: string,
  ): Promise<CredentialHistoryRecord[]> {
    const rows = await db.credentialHistory.findMany({
      where: { entryId },
      orderBy: { changedAt: "desc" },
      take: 5,
      include: historyInclude,
    });
    return rows.map(toRecord);
  },
};
