import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";

import { getSession, parseUserRole } from "@/lib/auth/session";
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

export async function requireRole(allowed: readonly UserRole[]) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  if (!allowed.includes(role)) {
    redirect("/unauthorized");
  }
  return { session, role };
}
