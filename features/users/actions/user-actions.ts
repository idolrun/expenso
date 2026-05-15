"use server";

import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { UserSummaryDto } from "@/features/users/domain/user-summary";
import { adminListUsers } from "@/features/users/application/user-admin.service";
import { getSession, parseUserRole } from "@/lib/auth/session";
import { hasPermission, Permission } from "@/lib/auth/permissions";

export async function listUsersAction(): Promise<
  ServiceResult<UserSummaryDto[]>
> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    };
  }

  const role = parseUserRole(session.user.role);
  if (!hasPermission(role, Permission.CAN_VIEW_USERS)) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    };
  }

  return adminListUsers();
}
