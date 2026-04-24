import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireExpenseReader, requireExpenseWriter } from "@/lib/api/auth-guard";
import {
  getSectionBudgetService,
  updateSectionBudgetService,
} from "@/features/budgets/application/budget.service";
import { updateSectionBudgetSchema } from "@/features/budgets/validation/budget";

const idParamSchema = z.string().uuid();

async function resolveId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = idParamSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}

function validationErrorResponse(message: string) {
  return NextResponse.json(
    { ok: false, error: { code: "VALIDATION_ERROR" as const, message } },
    { status: 400 },
  );
}

function serverErrorResponse(message: string, code: string = "INTERNAL_ERROR") {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status: 500 },
  );
}

/** GET /api/budgets/:id */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireExpenseReader();
    if (!auth.ok) return auth.response;

    const id = await resolveId(ctx);
    if (!id) return validationErrorResponse("Invalid UUID");

    const result = await getSectionBudgetService(id);
    if (!result.ok) {
      const status = result.error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return serverErrorResponse(message);
  }
}

/** PATCH /api/budgets/:id */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireExpenseWriter();
    if (!auth.ok) return auth.response;

    const id = await resolveId(ctx);
    if (!id) return validationErrorResponse("Invalid UUID");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationErrorResponse("Invalid JSON body");
    }

    const parsed = updateSectionBudgetSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    }

    const result = await updateSectionBudgetService(parsed.data, auth.userId);
    if (!result.ok) {
      const status = result.error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return serverErrorResponse(message);
  }
}
