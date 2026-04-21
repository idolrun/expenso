import type { Prisma } from "@/app/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";

export const expenseHistoryRepository = {
  async createMany(
    db: DbClient,
    rows: Prisma.ExpenseHistoryCreateManyInput[],
  ): Promise<void> {
    if (!rows.length) return;
    await db.expenseHistory.createMany({ data: rows });
  },

  async findForExpense(
    db: DbClient,
    expenseId: string,
    take = 200,
  ): Promise<
    Prisma.ExpenseHistoryGetPayload<{
      include: { expense: { select: { title: true; section: true } } };
    }>[]
  > {
    return db.expenseHistory.findMany({
      where: { expenseId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        expense: { select: { title: true, section: true } },
      },
    });
  },
};
