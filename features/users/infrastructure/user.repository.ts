import type { UserRole } from "@/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";

export const userRepository = {
  async getRoleById(db: DbClient, userId: string): Promise<UserRole | null> {
    const row = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return row?.role ?? null;
  },

  async listSummaries(db: DbClient) {
    return db.user.findMany({
      orderBy: { email: "asc" },
      select: { id: true, email: true, name: true, role: true },
    });
  },

  async updateRole(db: DbClient, userId: string, role: UserRole) {
    return db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  },
};
