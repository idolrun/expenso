import type { Prisma } from "@/generated/prisma/client";

export const expenseListInclude = {
  expenseTags: { include: { tag: true } },
  salaryRecord: true,
  submittedBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  rejectedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ExpenseInclude;

export type ExpenseWithListRelations = Prisma.ExpenseGetPayload<{
  include: typeof expenseListInclude;
}>;
