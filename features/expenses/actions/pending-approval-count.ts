"use server";

import { getSession, parseUserRole } from "@/lib/auth/session";
import { canAccessApprovals } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export async function getPendingApprovalCount(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  const role = parseUserRole(session.user.role);
  if (!canAccessApprovals(role)) return 0;

  return prisma.expense.count({
    where: { status: "SUBMITTED", deletedAt: null },
  });
}
