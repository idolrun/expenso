import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";

import { getSession, parseUserRole } from "@/lib/auth/session";
import { hasPermission, Permission, type Permission as PermissionType } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export { getSession, parseUserRole } from "@/lib/auth/session";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  const email = session.user.email?.trim().toLowerCase();
  if (email) {
    const allowedEmail = await prisma.allowedEmail.findUnique({
      where: { email },
      select: { isActive: true },
    });
    if (allowedEmail && !allowedEmail.isActive) {
      redirect("/unauthorized");
    }
  }
  return session;
}

/**
 * @deprecated Use requirePermission for granular access control.
 * Kept for simple route-level gating where redirect behavior is desired.
 */
export async function requireRole(allowed: readonly UserRole[]) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  if (!allowed.includes(role)) {
    redirect("/unauthorized");
  }
  return { session, role };
}

/**
 * Permission-based guard for server components / layouts.
 * Redirects to /unauthorized if the user lacks the required permission.
 */
export async function requirePermission(permission: PermissionType) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  if (!hasPermission(role, permission)) {
    redirect("/unauthorized");
  }
  return { session, role };
}
