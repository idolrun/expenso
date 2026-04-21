import { NextResponse } from "next/server";

import { getSession, parseUserRole } from "@/lib/auth/session";
import { canReadExpense } from "@/lib/auth/permissions";
import { UserRole } from "@/app/generated/prisma/client";

export async function requireExpenseReader() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  if (!canReadExpense(role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role };
}

export async function requireAuditReader() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  if (role !== UserRole.ADMIN) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Admin only" } },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role };
}
