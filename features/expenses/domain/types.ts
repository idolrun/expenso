import type { Prisma } from "@/app/generated/prisma/client";

export type {
  Attachment,
  Expense,
  ExpenseHistory,
  ExpenseTag,
} from "@/app/generated/prisma/client";

export {
  ExpenseSection,
  ExpenseStatus,
} from "@/app/generated/prisma/client";

/** Common filter shape for list/search (services fill in Phase 2). */
export type ExpenseListFilter = Pick<
  Prisma.ExpenseWhereInput,
  | "section"
  | "status"
  | "categoryId"
  | "createdById"
  | "updatedById"
  | "deletedAt"
  | "originalAmount"
  | "originalCurrency"
  | "createdAt"
  | "incurredOn"
> & {
  tagIds?: string[];
};
