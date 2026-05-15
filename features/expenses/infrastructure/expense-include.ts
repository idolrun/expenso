import type { Prisma } from "@/generated/prisma/client";

export const expenseListInclude = {
  expenseTags: { include: { tag: true } },
  salaryRecord: true,
} satisfies Prisma.ExpenseInclude;

export type ExpenseWithListRelations = Prisma.ExpenseGetPayload<{
  include: typeof expenseListInclude;
}>;
