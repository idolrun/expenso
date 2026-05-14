import type { Prisma } from "@/generated/prisma/client";

export type {
  Attachment,
  Expense,
  ExpenseHistory,
  ExpenseTag,
} from "@/generated/prisma/client";
export { ExpenseSection, ExpenseStatus } from "@/generated/prisma/client";

/** Common filter shape for list/search (services fill in Phase 2). */
export type ExpenseListFilter = Pick<
  Prisma.ExpenseWhereInput,
  | "section"
  | "status"
  | "paymentType"
  | "deletedAt"
  | "originalAmount"
  | "originalCurrency"
  | "createdAt"
  | "fromDate"
  | "toDate"
> & {
  tagIds?: string[];
};
