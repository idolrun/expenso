import type { Prisma } from "@/generated/prisma/client";

export const expenseListInclude = {
  category: true,
  expenseTags: { include: { tag: true } },
} satisfies Prisma.ExpenseInclude;

export type ExpenseWithListRelations = Prisma.ExpenseGetPayload<{
  include: typeof expenseListInclude;
}>;
