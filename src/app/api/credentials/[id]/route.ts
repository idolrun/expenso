import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCredentialReader } from "@/lib/api/auth-guard";
import { credentialRepository } from "@/features/credentials/infrastructure/credential.repository";
import { prisma } from "@/lib/prisma";

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

  const result = await credentialRepository.findById(prisma, idParsed.data);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Credential entry not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: result });
}
