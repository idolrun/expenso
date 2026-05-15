import { NextResponse } from "next/server";

import { adminListUsers } from "@/features/users/application/user-admin.service";
import { requirePermissionGuard } from "@/lib/api/auth-guard";
import { Permission } from "@/lib/auth/permissions";

export async function GET() {
  const auth = await requirePermissionGuard(Permission.CAN_VIEW_USERS);
  if (!auth.ok) {
    return auth.response;
  }

  const result = await adminListUsers();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
