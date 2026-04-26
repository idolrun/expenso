import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";

import { getSession, parseUserRole } from "@/lib/auth/session";

export { getSession, parseUserRole } from "@/lib/auth/session";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireRole(allowed: readonly UserRole[]) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  if (!allowed.includes(role)) {
    redirect("/unauthorized");
  }
  return { session, role };
}
