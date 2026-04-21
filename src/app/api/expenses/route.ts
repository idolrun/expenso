import { NextRequest, NextResponse } from "next/server";

import { requireExpenseReader } from "@/lib/api/auth-guard";
import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { listExpenses } from "@/features/expenses/application/expense-query.service";

export async function GET(req: NextRequest) {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listExpensesQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join("; "),
        },
      },
      { status: 400 },
    );
  }

  const result = await listExpenses(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
