import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireExpenseReader } from "@/lib/api/auth-guard";
import { getExpenseById } from "@/features/expenses/application/expense-query.service";

const idParamSchema = z.string().trim().min(1).max(128);

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: rawId } = await ctx.params;
  const idParsed = idParamSchema.safeParse(rawId);
  if (!idParsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid id" },
      },
      { status: 400 },
    );
  }

  const result = await getExpenseById(idParsed.data);
  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
