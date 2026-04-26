import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCredentialReader } from "@/lib/api/auth-guard";
import { getCredentialHistoryService } from "@/features/credentials/application/credential.service";

const idParamSchema = z.string().cuid();

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCredentialReader();
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

  const result = await getCredentialHistoryService(idParsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
