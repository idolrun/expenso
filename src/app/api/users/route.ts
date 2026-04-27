import { NextResponse } from "next/server";

import { adminListUsers } from "@/features/users/application/user-admin.service";
import { requireAuditReader } from "@/lib/api/auth-guard";

export async function GET() {
  const auth = await requireAuditReader();
  if (!auth.ok) {
    return auth.response;
  }

  const result = await adminListUsers(auth.role);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
