import { NextResponse } from "next/server";

import { getDashboardSummary } from "@/features/dashboard/application/dashboard-summary.service";
import { requireExpenseReader } from "@/lib/api/auth-guard";

export async function GET() {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const result = await getDashboardSummary();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
