/**
 * Shared USD→NPR exchange-rate fetching logic.
 * Module-level cache (3-hour TTL) is shared across all callers in the same
 * Node.js process — both the API route handler and the FX snapshot service.
 */

type CachedRate = {
  rate: number;
  lastUpdated: string;
  expiresAt: number;
};

export type ExchangeRatePayload = {
  rate: number;
  lastUpdated: string;
};

type ApiSuccess = {
  result: "success";
  time_last_update_utc?: string;
  conversion_rates?: { NPR?: number };
};

type ApiError = {
  result?: "error";
  "error-type"?: string;
};

const REVALIDATE_MS = 10_800_000; // 3 hours

let _cache: CachedRate | null = null;

function toPayload(c: CachedRate): ExchangeRatePayload {
  return { rate: c.rate, lastUpdated: c.lastUpdated };
}

/** Fetch (or return cached) the current 1 USD → NPR rate. Returns null on error. */
export async function fetchUsdNprRate(): Promise<ExchangeRatePayload | null> {
  // Snapshot at function entry to prevent control-flow narrowing issues.
  const cached: CachedRate | null = _cache;

  if (cached !== null && cached.expiresAt > Date.now()) {
    return toPayload(cached);
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY?.trim();
  if (!apiKey) return cached ? toPayload(cached) : null;

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      { cache: "force-cache", next: { revalidate: 10800 } },
    );

    if (!res.ok) return cached ? toPayload(cached) : null;

    const body = (await res.json()) as ApiSuccess | ApiError;
    if (body.result !== "success") return cached ? toPayload(cached) : null;

    const rate = (body as ApiSuccess).conversion_rates?.NPR;
    if (typeof rate !== "number" || !Number.isFinite(rate)) return null;

    const lastUpdated = (body as ApiSuccess).time_last_update_utc
      ? new Date((body as ApiSuccess).time_last_update_utc!).toISOString()
      : new Date().toISOString();

    _cache = { rate, lastUpdated, expiresAt: Date.now() + REVALIDATE_MS };
    return { rate, lastUpdated };
  } catch {
    return cached ? toPayload(cached) : null;
  }
}
