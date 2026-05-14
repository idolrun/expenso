import { Prisma } from "@/generated/prisma/client";
import type { CurrencyCode } from "@/generated/prisma/client";

import { fetchUsdNprRate } from "@/lib/exchange-rate";

export type FxSnapshotFields = {
  amountUsd: Prisma.Decimal;
  amountNpr: Prisma.Decimal;
  fxRateUsdNpr: Prisma.Decimal;
  fxRateSnapshotAt: Date;
};

/**
 * Compute the FX snapshot for an expense amount.
 *
 * This function **never returns null** — it uses a tiered fallback strategy
 * (live API → DB cache → hard-coded fallback) to ensure every expense
 * records a historical FX rate at creation/update time.
 */
export async function computeFxSnapshot(
  originalAmount: Prisma.Decimal,
  originalCurrency: CurrencyCode,
): Promise<FxSnapshotFields> {
  const rateData = await fetchUsdNprRate();

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
