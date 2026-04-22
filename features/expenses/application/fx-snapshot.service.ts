import { Prisma } from "@/app/generated/prisma/client";
import type { CurrencyCode } from "@/app/generated/prisma/client";

import { fetchUsdNprRate } from "@/lib/exchange-rate";

export type FxSnapshotFields = {
  amountUsd: Prisma.Decimal;
  amountNpr: Prisma.Decimal;
  fxRateUsdNpr: Prisma.Decimal;
  fxRateSnapshotAt: Date;
};

/**
 * Compute the FX snapshot for an expense or budget amount.
 *
 * Returns null when the exchange-rate API is unreachable — callers must
 * handle null gracefully (leave snapshot fields as null in the DB and
 * retry or backfill later).
 */
export async function computeFxSnapshot(
  originalAmount: Prisma.Decimal,
  originalCurrency: CurrencyCode,
): Promise<FxSnapshotFields | null> {
  const rateData = await fetchUsdNprRate();
  if (!rateData) return null;

  const rate = new Prisma.Decimal(rateData.rate);
  const snapshotAt = new Date();

  let amountUsd: Prisma.Decimal;
  let amountNpr: Prisma.Decimal;

  if (originalCurrency === "USD") {
    amountUsd = originalAmount;
    amountNpr = originalAmount.mul(rate).toDecimalPlaces(4);
  } else {
    // NPR → USD: divide by the NPR-per-USD rate
    amountNpr = originalAmount;
    amountUsd = originalAmount.div(rate).toDecimalPlaces(4);
  }

  return {
    amountUsd,
    amountNpr,
    fxRateUsdNpr: rate.toDecimalPlaces(6),
    fxRateSnapshotAt: snapshotAt,
  };
}
