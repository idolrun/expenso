import type { Expense, Prisma } from "@/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";
import {
  expenseListInclude,
  type ExpenseWithListRelations,
} from "@/features/expenses/infrastructure/expense-include";

export const expenseRepository = {
  async findActiveById(
    db: DbClient,
    id: string,
  ): Promise<ExpenseWithListRelations | null> {
    return db.expense.findFirst({
      where: { id, deletedAt: null },
      include: expenseListInclude,
    });
  },

  async findByIdIncludingDeleted(
    db: DbClient,
    id: string,
  ): Promise<ExpenseWithListRelations | null> {
    return db.expense.findFirst({
      where: { id },
      include: expenseListInclude,
    });
  },

  async create(
    db: DbClient,
    data: Prisma.ExpenseCreateInput,
  ): Promise<Expense> {
    return db.expense.create({ data });
  },

  async update(
    db: DbClient,
    id: string,
    data: Prisma.ExpenseUpdateInput,
  ): Promise<Expense> {
    return db.expense.update({ where: { id }, data });
  },

  async countWhere(db: DbClient, where: Prisma.ExpenseWhereInput) {
    return db.expense.count({ where });
  },

  async findManyWhere(
    db: DbClient,
    args: {
      where: Prisma.ExpenseWhereInput;
      orderBy: Prisma.ExpenseOrderByWithRelationInput[];
      skip: number;
      take: number;
    },
  ): Promise<ExpenseWithListRelations[]> {
    return db.expense.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
      include: expenseListInclude,
    });
  },

  async findManySearch(
    db: DbClient,
    args: { where: Prisma.ExpenseWhereInput; take: number },
  ): Promise<ExpenseWithListRelations[]> {
    return db.expense.findMany({
      where: args.where,
      take: args.take,
      include: expenseListInclude,
    });
  },

  async replaceExpenseTags(
    db: DbClient,
    expenseId: string,
    tagIds: string[],
    assignedById: string,
  ) {
    await db.expenseTag.deleteMany({
      where: {
        expenseId,
        ...(tagIds.length
          ? { tagId: { notIn: tagIds } }
          : {}),
      },
    });

    if (!tagIds.length) return;

    await db.expenseTag.createMany({
      data: tagIds.map((tagId) => ({
        expenseId,
        tagId,
        assignedById,
      })),
      skipDuplicates: true,
    });
  },

  async assertTagsExist(db: DbClient, tagIds: string[]) {
    if (!tagIds.length) return;
    const count = await db.tag.count({ where: { id: { in: tagIds } } });
    if (count !== tagIds.length) {
      throw new Error("One or more tags do not exist");
    }
  },

  async assertCategoryExists(db: DbClient, categoryId: string | null) {
    if (!categoryId) return;
    const c = await db.category.findFirst({
      where: { id: categoryId, isActive: true },
    });
    if (!c) {
      throw new Error("Category not found or inactive");
    }
  },
};
