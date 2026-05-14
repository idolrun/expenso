/**
 * Shared USD→NPR exchange-rate fetching logic.
 * Tiered fallback strategy for production resilience:
 *   1. Live API (3-hour module cache)
 *   2. Database cache (ExchangeRateCache table, 24h TTL)
 *   3. Hard-coded fallback rate (last resort, logged as warning)
 */

import { prisma } from "@/lib/prisma";

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

const REVALATE_MS = 10_800_000; // 3 hours
const DB_CACHE_TTL_MS = 86_400_000; // 24 hours

/** Hard-coded fallback rate — update periodically to match market reality. */
export const FALLBACK_RATE = 133.0;

let _memoryCache: CachedRate | null = null;

function toPayload(c: CachedRate): ExchangeRatePayload {
  return { rate: c.rate, lastUpdated: c.lastUpdated };
}

async function getDbCachedRate(): Promise<ExchangeRatePayload | null> {
  try {
    const row = await prisma.exchangeRateCache.findFirst({
      where: {
        pair: "USD_NPR",
        expiresAt: { gt: new Date() },
      },
      orderBy: { cachedAt: "desc" },
    });
    if (!row) return null;
    return { rate: row.rate.toNumber(), lastUpdated: row.cachedAt.toISOString() };
  } catch {
    return null;
  }
}

async function saveDbCache(rate: number, source: string): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DB_CACHE_TTL_MS);
    await prisma.exchangeRateCache.upsert({
      where: { pair: "USD_NPR" },
      update: { rate, source, cachedAt: now, expiresAt },
      create: { pair: "USD_NPR", rate, source, cachedAt: now, expiresAt },
    });
  } catch {
    // Non-critical: in-memory cache is sufficient
  }
}

/** Fetch (or return cached) the current 1 USD → NPR rate. Never returns null in production. */
export async function fetchUsdNprRate(): Promise<ExchangeRatePayload> {
  const memory: CachedRate | null = _memoryCache;

  if (memory !== null && memory.expiresAt > Date.now()) {
    return toPayload(memory);
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY?.trim();

  if (apiKey) {
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
        { cache: "force-cache", next: { revalidate: 10800 } },
      );

      if (res.ok) {
        const body = (await res.json()) as ApiSuccess | ApiError;
        if (body.result === "success") {
          const rate = (body as ApiSuccess).conversion_rates?.NPR;
          if (typeof rate === "number" && Number.isFinite(rate)) {
            const lastUpdated = (body as ApiSuccess).time_last_update_utc
              ? new Date((body as ApiSuccess).time_last_update_utc!).toISOString()
              : new Date().toISOString();

            _memoryCache = { rate, lastUpdated, expiresAt: Date.now() + REVALATE_MS };
            await saveDbCache(rate, "api");
            return { rate, lastUpdated };
          }
        }
      }
    } catch {
      // Fall through to DB cache
    }
  }

  // Tier 2: DB cache
  const dbCached = await getDbCachedRate();
  if (dbCached) {
    _memoryCache = {
      rate: dbCached.rate,
      lastUpdated: dbCached.lastUpdated,
      expiresAt: Date.now() + REVALATE_MS,
    };
    return dbCached;
  }

  // Tier 3: hard-coded fallback
  console.warn("[exchange-rate] All rate sources failed. Using fallback rate.", FALLBACK_RATE);
  const fallbackPayload = { rate: FALLBACK_RATE, lastUpdated: new Date().toISOString() };
  _memoryCache = { rate: FALLBACK_RATE, lastUpdated: fallbackPayload.lastUpdated, expiresAt: Date.now() + REVALATE_MS };
  return fallbackPayload;
}
