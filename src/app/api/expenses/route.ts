import { NextRequest, NextResponse } from "next/server";

import { requireExpenseReader } from "@/lib/api/auth-guard";
import { listExpenses } from "@/features/expenses/application/expense-query.service";
import { parseListExpensesQueryFromUrlSearchParams } from "@/src/features/expenses/api/list-expense-query-url";

export async function GET(req: NextRequest) {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseListExpensesQueryFromUrlSearchParams(req.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.message,
        },
      },
      { status: 400 },
    );
  }

  const result = await listExpenses(parsed.query);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
