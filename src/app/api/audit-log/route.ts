import { NextRequest, NextResponse } from "next/server";

import { requireAuditReader } from "@/lib/api/auth-guard";
import { auditLogQuerySchema } from "@/features/audit/validation/audit-log-query";
import { listAuditLogs } from "@/features/audit/application/audit-query.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuditReader();
  if (!auth.ok) {
    return auth.response;
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = auditLogQuerySchema.safeParse(params);
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

  const result = await listAuditLogs(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
