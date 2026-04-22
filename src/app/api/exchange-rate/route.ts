import { NextResponse } from "next/server";

import { fetchUsdNprRate } from "@/lib/exchange-rate";
import { requireExpenseReader } from "@/lib/api/auth-guard";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const data = await fetchUsdNprRate();
  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "EXCHANGE_RATE_UNAVAILABLE",
          message: "Unable to load the USD to NPR exchange rate",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, data });
}
