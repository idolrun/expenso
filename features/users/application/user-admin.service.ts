import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { UserSummaryDto } from "@/features/users/domain/user-summary";
import { userRepository } from "@/features/users/infrastructure/user.repository";
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
