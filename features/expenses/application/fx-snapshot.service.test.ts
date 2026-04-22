import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/app/generated/prisma/client";

// Mock the exchange-rate module before importing the service.
vi.mock("@/lib/exchange-rate", () => ({
  fetchUsdNprRate: vi.fn(),
}));

import { fetchUsdNprRate } from "@/lib/exchange-rate";
import { computeFxSnapshot } from "@/features/expenses/application/fx-snapshot.service";

const mockFetchRate = vi.mocked(fetchUsdNprRate);

// Helpers
const dec = (n: string | number) => new Prisma.Decimal(n);

describe("computeFxSnapshot", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── Rate fetch failure ───────────────────────────────────────────────────

  it("returns null when fetchUsdNprRate returns null (API unavailable)", async () => {
    mockFetchRate.mockResolvedValueOnce(null);
    const result = await computeFxSnapshot(dec(100), "USD");
    expect(result).toBeNull();
  });

  // ── USD → NPR conversion ────────────────────────────────────────────────

  it("converts USD amount to NPR using the fetched rate", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 135, lastUpdated: "2024-01-01T00:00:00Z" });

    const result = await computeFxSnapshot(dec(10), "USD");

    expect(result).not.toBeNull();
    // amountUsd should equal the original USD amount
    expect(result!.amountUsd.toString()).toBe("10");
    // amountNpr = 10 * 135 = 1350
    expect(result!.amountNpr.toNumber()).toBeCloseTo(1350, 2);
  });

  it("rounds NPR equivalent to 4 decimal places", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 135.678901, lastUpdated: "2024-01-01T00:00:00Z" });

    const result = await computeFxSnapshot(dec("1"), "USD");

    expect(result).not.toBeNull();
    // Verify the result has at most 4 decimal places
    const nprStr = result!.amountNpr.toString();
    const decimalPart = nprStr.split(".")[1] ?? "";
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });

  // ── NPR → USD conversion ────────────────────────────────────────────────

  it("converts NPR amount to USD using the fetched rate", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 135, lastUpdated: "2024-01-01T00:00:00Z" });

    const result = await computeFxSnapshot(dec(1350), "NPR");

    expect(result).not.toBeNull();
    // amountNpr should equal the original NPR amount
    expect(result!.amountNpr.toString()).toBe("1350");
    // amountUsd = 1350 / 135 = 10
    expect(result!.amountUsd.toNumber()).toBeCloseTo(10, 2);
  });

  it("rounds USD equivalent to 4 decimal places for NPR input", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 135, lastUpdated: "2024-01-01T00:00:00Z" });

    // 100 NPR / 135 = 0.740740... → should round to 4dp
    const result = await computeFxSnapshot(dec(100), "NPR");

    expect(result).not.toBeNull();
    const usdStr = result!.amountUsd.toString();
    const decimalPart = usdStr.split(".")[1] ?? "";
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });

  // ── FX rate fields ───────────────────────────────────────────────────────

  it("stores the exchange rate in fxRateUsdNpr", async () => {
    const rate = 133.50;
    mockFetchRate.mockResolvedValueOnce({ rate, lastUpdated: "2024-06-01T00:00:00Z" });

    const result = await computeFxSnapshot(dec(50), "USD");

    expect(result).not.toBeNull();
    expect(result!.fxRateUsdNpr.toNumber()).toBeCloseTo(rate, 4);
  });

  it("stores fxRateUsdNpr rounded to 6 decimal places", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 133.1234567, lastUpdated: "2024-06-01T00:00:00Z" });

    const result = await computeFxSnapshot(dec(10), "USD");

    expect(result).not.toBeNull();
    const rateStr = result!.fxRateUsdNpr.toString();
    const decimalPart = rateStr.split(".")[1] ?? "";
    expect(decimalPart.length).toBeLessThanOrEqual(6);
  });

  it("returns a Date for fxRateSnapshotAt", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 135, lastUpdated: "2024-01-01T00:00:00Z" });

    const before = Date.now();
    const result = await computeFxSnapshot(dec(1), "USD");
    const after = Date.now();

    expect(result).not.toBeNull();
    expect(result!.fxRateSnapshotAt).toBeInstanceOf(Date);
    expect(result!.fxRateSnapshotAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result!.fxRateSnapshotAt.getTime()).toBeLessThanOrEqual(after);
  });

  // ── Large amounts (Decimal precision) ───────────────────────────────────

  it("handles large USD amounts without precision loss", async () => {
    mockFetchRate.mockResolvedValueOnce({ rate: 135, lastUpdated: "2024-01-01T00:00:00Z" });

    const result = await computeFxSnapshot(dec("1000000"), "USD");

    expect(result).not.toBeNull();
    // 1,000,000 USD * 135 = 135,000,000 NPR
    expect(result!.amountNpr.toNumber()).toBeCloseTo(135_000_000, 0);
  });
});
