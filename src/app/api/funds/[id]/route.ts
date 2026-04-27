import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fundService } from "@/features/funds/application/fund.service";
import { requireFundReader } from "@/lib/api/auth-guard";

const idParamSchema = z.string().trim().min(1);

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireFundReader(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id: rawId } = await ctx.params;
  const idParsed = idParamSchema.safeParse(rawId);
  if (!idParsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid id",
        },
      },
      { status: 400 },
    );
  }

  try {
    const entry = await fundService.getById(idParsed.data);
    return NextResponse.json({ ok: true, data: entry });
  } catch (error) {
    if (error instanceof Error && error.message === "Fund entry not found") {
      return NextResponse.json(
        { ok: false, error: "Fund entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Failed to fetch fund entry" },
      { status: 500 },
    );
  }
}
