import { NextRequest, NextResponse } from "next/server";

import { requireExpenseReader, requireExpenseWriter } from "@/lib/api/auth-guard";
import {
  listSectionBudgetsService,
  createSectionBudgetService,
} from "@/features/budgets/application/budget.service";
import {
  createSectionBudgetSchema,
  listSectionBudgetsQuerySchema,
} from "@/features/budgets/validation/budget";

/** GET /api/budgets — paginated list of section budgets */
export async function GET(req: NextRequest) {
  const auth = await requireExpenseReader();
  if (!auth.ok) return auth.response;

  const parsed = listSectionBudgetsQuerySchema.safeParse(
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

  const result = await listSectionBudgetsService(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: result.data });
}

/** POST /api/budgets — create a section budget */
export async function POST(req: NextRequest) {
  const auth = await requireExpenseWriter();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const parsed = createSectionBudgetSchema.safeParse(body);
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

  const result = await createSectionBudgetService(parsed.data, auth.userId);
  if (!result.ok) {
    const status = result.error.code === "CONFLICT" ? 409 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
}
