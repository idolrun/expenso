import { UserRole } from "@/app/generated/prisma/client";

import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { UserSummaryDto } from "@/features/users/domain/user-summary";
import { userRepository } from "@/features/users/infrastructure/user.repository";
import { updateUserRoleSchema } from "@/features/users/validation/role";
import { prisma } from "@/lib/prisma";

export async function adminListUsers(): Promise<ServiceResult<UserSummaryDto[]>> {
  try {
    const rows = await userRepository.listSummaries(prisma);
    return { ok: true, data: rows };
  } catch (e) {
    const message = e instanceof Error ? e.message : "User list failed";
    return { ok: false, error: { code: "USER_LIST_FAILED", message } };
  }
}

export async function adminSetUserRole(
  actorRole: UserRole,
  actorUserId: string,
  raw: unknown,
): Promise<ServiceResult<UserSummaryDto>> {
  if (actorRole !== UserRole.ADMIN) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Admin only" } };
  }

  const parsed = updateUserRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const { userId, role } = parsed.data;

  if (userId === actorUserId && role !== UserRole.ADMIN) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "You cannot remove your own admin role" },
    };
  }

  try {
    const row = await userRepository.updateRole(prisma, userId, role);
    return { ok: true, data: row };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Role update failed";
    return { ok: false, error: { code: "ROLE_UPDATE_FAILED", message } };
  }
}
