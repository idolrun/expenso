import type { BudgetPeriod, ExpenseSection, Prisma, SectionBudget } from "@/generated/prisma/client";

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

  async findBySectionAndPeriod(
    db: DbClient,
    section: ExpenseSection,
    period: BudgetPeriod,
  ): Promise<SectionBudget | null> {
    return db.sectionBudget.findUnique({
      where: { section_period: { section, period } },
    });
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
};
