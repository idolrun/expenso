/**
 * Backfill FX snapshot fields for expenses that were created while the
 * exchange-rate API was unreachable (amountUsd / amountNpr / fxRateUsdNpr are null).
 *
 * Usage:
 *   npx tsx scripts/backfill-fx-snapshot.ts
 *
 * This script is idempotent — running it multiple times is safe.
 */

import { Prisma } from "@/generated/prisma/client";
import { computeFxSnapshot } from "@/features/expenses/application/fx-snapshot.service";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 100;

async function main() {
  let offset = 0;
  let updated = 0;
  let failed = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await prisma.expense.findMany({
      where: {
        OR: [{ amountUsd: null }, { amountNpr: null }, { fxRateUsdNpr: null }],
      },
      select: {
        id: true,
        originalAmount: true,
        originalCurrency: true,
      },
      take: BATCH_SIZE,
      skip: offset,
      orderBy: { createdAt: "asc" },
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        const snapshot = await computeFxSnapshot(
          row.originalAmount,
          row.originalCurrency,
        );
        await prisma.expense.update({
          where: { id: row.id },
          data: {
            amountUsd: snapshot.amountUsd,
            amountNpr: snapshot.amountNpr,
            fxRateUsdNpr: snapshot.fxRateUsdNpr,
            fxRateSnapshotAt: snapshot.fxRateSnapshotAt,
          },
        });
        updated++;
      } catch (e) {
        console.error(`Failed to backfill expense ${row.id}:`, e);
        failed++;
      }
    }

    offset += BATCH_SIZE;
    console.log(`Processed ${offset} rows... (updated: ${updated}, failed: ${failed})`);
  }

  console.log(`\nBackfill complete. Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
