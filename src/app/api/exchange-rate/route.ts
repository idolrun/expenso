import { NextResponse } from "next/server";

import { requireExpenseReader } from "@/lib/api/auth-guard";

const REVALIDATE_SECONDS = 10800;

type ExchangeRateApiSuccessResponse = {
  result: "success";
  time_last_update_utc?: string;
  conversion_rates?: {
    NPR?: number;
  };
};

type ExchangeRateApiErrorResponse = {
  result?: "error";
  "error-type"?: string;
};

type CachedExchangeRate = {
  rate: number;
  lastUpdated: string;
  expiresAt: number;
};

let memoryCache: CachedExchangeRate | null = null;

export const runtime = "nodejs";

function toPayload(cache: CachedExchangeRate) {
  return {
    rate: cache.rate,
    lastUpdated: cache.lastUpdated,
  };
}

function hasFreshMemoryCache(cache: CachedExchangeRate | null): cache is CachedExchangeRate {
  return cache !== null && cache.expiresAt > Date.now();
}

function getCachedFallbackResponse() {
  return memoryCache ? NextResponse.json(toPayload(memoryCache)) : null;
}

export async function GET() {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  if (hasFreshMemoryCache(memoryCache)) {
    return NextResponse.json(toPayload(memoryCache));
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CONFIGURATION_ERROR",
          message: "EXCHANGE_RATE_API_KEY is not configured",
        },
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      {
        cache: "force-cache",
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );

    if (!response.ok) {
      return (
        getCachedFallbackResponse() ??
        NextResponse.json(
          {
            ok: false,
            error: {
              code: "UPSTREAM_ERROR",
              message: "Exchange rate provider returned an error",
            },
          },
          { status: 502 },
        )
      );
    }

    const body = (await response.json()) as
      | ExchangeRateApiSuccessResponse
      | ExchangeRateApiErrorResponse;

    if (body.result !== "success") {
      return (
        getCachedFallbackResponse() ??
        NextResponse.json(
          {
            ok: false,
            error: {
              code: "UPSTREAM_ERROR",
              message:
                typeof body["error-type"] === "string"
                  ? body["error-type"]
                  : "Exchange rate provider returned an invalid response",
            },
          },
          { status: 502 },
        )
      );
    }

    const rate = body.conversion_rates?.NPR;
    if (typeof rate !== "number" || !Number.isFinite(rate)) {
      throw new Error("NPR exchange rate was missing from the provider response");
    }

    const lastUpdated = body.time_last_update_utc
      ? new Date(body.time_last_update_utc).toISOString()
      : new Date().toISOString();

    memoryCache = {
      rate,
      lastUpdated,
      expiresAt: Date.now() + REVALIDATE_SECONDS * 1000,
    };

    return NextResponse.json(toPayload(memoryCache));
  } catch (error) {
    return (
      getCachedFallbackResponse() ??
      NextResponse.json(
        {
          ok: false,
          error: {
            code: "EXCHANGE_RATE_UNAVAILABLE",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load the USD to NPR exchange rate",
          },
        },
        { status: 502 },
      )
    );
  }
}
