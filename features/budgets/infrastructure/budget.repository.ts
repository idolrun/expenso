import type { Prisma, SectionBudget } from "@/app/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";

export const budgetRepository = {
  async create(
    db: DbClient,
    data: Prisma.SectionBudgetCreateInput,
  ): Promise<SectionBudget> {
    return db.sectionBudget.create({ data });
  },

  async update(
    db: DbClient,
    id: string,
    data: Prisma.SectionBudgetUpdateInput,
  ): Promise<SectionBudget> {
    return db.sectionBudget.update({ where: { id }, data });
  },

  async findById(db: DbClient, id: string): Promise<SectionBudget | null> {
    return db.sectionBudget.findUnique({ where: { id } });
  },

  async findMany(
    db: DbClient,
    args: {
      where?: Prisma.SectionBudgetWhereInput;
      orderBy?: Prisma.SectionBudgetOrderByWithRelationInput[];
      skip?: number;
      take?: number;
    },
  ): Promise<SectionBudget[]> {
    return db.sectionBudget.findMany({
      where: args.where,
      orderBy: args.orderBy ?? [{ periodStart: "desc" }],
      skip: args.skip,
      take: args.take,
    });
  },

  async countWhere(
    db: DbClient,
    where: Prisma.SectionBudgetWhereInput,
  ): Promise<number> {
    return db.sectionBudget.count({ where });
  },

  /**
   * Find the single active budget for a section whose window overlaps a given date.
   * Returns the most-recently-started one if multiple overlap (shouldn't happen
   * due to the unique constraint, but is defensive).
   */
  async findActiveForSectionAt(
    db: DbClient,
    section: Prisma.EnumExpenseSectionFilter["equals"],
    referenceDate: Date,
  ): Promise<SectionBudget | null> {
    const rows = await db.sectionBudget.findMany({
      where: {
        section,
        isActive: true,
        periodStart: { lte: referenceDate },
        periodEnd: { gte: referenceDate },
      },
      orderBy: { periodStart: "desc" },
      take: 1,
    });
    return rows[0] ?? null;
  },
};
