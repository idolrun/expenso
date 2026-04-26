import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCredentialReader } from "@/lib/api/auth-guard";
import { listCredentialsService } from "@/features/credentials/application/credential.service";
import { credentialAuthMethodValues } from "@/features/credentials/validation/credential";

const querySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  authMethod: z.enum(credentialAuthMethodValues).optional(),
  search: z.string().trim().max(200).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireCredentialReader();
  if (!auth.ok) {
    return auth.response;
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
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

  const result = await listCredentialsService(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
