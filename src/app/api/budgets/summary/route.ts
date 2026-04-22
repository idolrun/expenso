import { NextRequest, NextResponse } from "next/server";

import { requireExpenseReader } from "@/lib/api/auth-guard";
import { getSectionBudgetSummaryService } from "@/features/budgets/application/budget.service";
import { budgetSummaryQuerySchema } from "@/features/budgets/validation/budget";
import type { CurrencyCode, ExpenseSection } from "@/app/generated/prisma/client";

/**
 * GET /api/budgets/summary?section=TECH&period=MONTHLY&displayCurrency=USD
 *
 * Returns the budget summary for a specific section + period.
 * Threshold, spent percent, and remaining amount are all pre-computed
 * from FX snapshots — no live rate call needed.
 */
export async function GET(req: NextRequest) {
  const auth = await requireExpenseReader();
  if (!auth.ok) return auth.response;

  const parsed = budgetSummaryQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
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

  const result = await getSectionBudgetSummaryService(
    parsed.data.section as ExpenseSection,
    parsed.data.period,
    parsed.data.displayCurrency as CurrencyCode,
  );

  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
