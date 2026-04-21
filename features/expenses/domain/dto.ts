import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

/** Serializable tag on an expense. */
export type ExpenseTagDto = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

/** Optional category summary on an expense. */
export type ExpenseCategoryDto = {
  id: string;
  name: string;
  slug: string;
  section: ExpenseSection;
} | null;

/** List / detail row for API and actions. */
export type ExpenseDto = {
  id: string;
  section: ExpenseSection;
  status: ExpenseStatus;
  title: string;
  notes: string | null;
  amount: string;
  currency: string;
  incurredOn: string;
  categoryId: string | null;
  category: ExpenseCategoryDto;
  tags: ExpenseTagDto[];
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ExpenseHistoryEntryDto = {
  id: string;
  expenseId: string;
  batchId: string | null;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedById: string;
  createdAt: string;
};

/** Field-level history row with parent expense context (list/timeline UI). */
export type ExpenseHistoryWithExpenseDto = ExpenseHistoryEntryDto & {
  expenseTitle: string;
  expenseSection: ExpenseSection;
};

export type AuditLogEntryDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  metadata: unknown;
  createdAt: string;
};

export type PaginatedDto<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type GlobalSearchHitDto = {
  type: "expense";
  id: string;
  title: string;
  section: ExpenseSection;
  amount: string;
  currency: string;
  /** Where the query matched (best-effort). */
  matchedOn: "title" | "notes" | "category" | "tag";
};

export type ServiceError = {
  code: string;
  message: string;
};

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };
