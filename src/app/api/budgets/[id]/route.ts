import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireExpenseReader, requireExpenseWriter } from "@/lib/api/auth-guard";
import {
  getSectionBudgetService,
  updateSectionBudgetService,
} from "@/features/budgets/application/budget.service";
import { updateSectionBudgetSchema } from "@/features/budgets/validation/budget";

const idSchema = z.string().uuid();

async function resolveId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = idSchema.safeParse(id);
  return p.success ? p.data : null;
}

/** GET /api/budgets/:id */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireExpenseReader();
  if (!auth.ok) return auth.response;

  const id = await resolveId(ctx);
  if (!id) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid UUID" } },
      { status: 400 },
    );
  }

  const result = await getSectionBudgetService(id);
  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}

/** PATCH /api/budgets/:id */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireExpenseWriter();
  if (!auth.ok) return auth.response;

  const id = await resolveId(ctx);
  if (!id) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid UUID" } },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const merged =
    typeof body === "object" && body !== null ? { ...body, id } : { id };
  const parsed = updateSectionBudgetSchema.safeParse(merged);
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

  const result = await updateSectionBudgetService(parsed.data, auth.userId);
  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
