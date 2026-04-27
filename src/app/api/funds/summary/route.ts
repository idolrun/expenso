import { NextRequest, NextResponse } from "next/server";

import { fundService } from "@/features/funds/application/fund.service";
import { requireFundReader } from "@/lib/api/auth-guard";

export async function GET(request: NextRequest) {
  const auth = await requireFundReader(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const summary = await fundService.getSummary();
    return NextResponse.json({ ok: true, data: summary });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch fund summary" },
      { status: 500 },
    );
  }
}
