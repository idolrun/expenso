"use server";

import { UserRole } from "@/app/generated/prisma/client";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession, parseUserRole } from "@/lib/auth/session";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { UserSummaryDto } from "@/features/users/domain/user-summary";
import {
  adminListUsers,
  adminSetUserRole,
} from "@/features/users/application/user-admin.service";

async function requireSessionUser() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    };
  }
  return { ok: true as const, session, userId: sessionToUserId(session) };
}

export async function listUsersAction(): Promise<ServiceResult<UserSummaryDto[]>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  if (role !== UserRole.ADMIN) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Admin only" } };
  }
  return adminListUsers();
}

export async function updateUserRoleAction(
  raw: unknown,
): Promise<ServiceResult<UserSummaryDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  return adminSetUserRole(role, auth.userId, raw);
}
