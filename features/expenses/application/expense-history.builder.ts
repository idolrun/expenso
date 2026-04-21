import type { Prisma } from "@/app/generated/prisma/client";
import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";
import {
  defaultExpenseCurrency,
  expenseCurrencyValues,
  type ExpenseCurrencyCode,
} from "@/features/expenses/domain/currency";

export type ExpenseScalarSnapshot = {
  section: ExpenseSection;
  status: ExpenseStatus;
  title: string;
  notes: string | null;
  amount: string;
  currency: ExpenseCurrencyCode;
  incurredOn: string;
  categoryId: string | null;
  tagIds: string[];
};

function json(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toExpenseCurrencyCode(currency: string): ExpenseCurrencyCode {
  return expenseCurrencyValues.includes(currency as ExpenseCurrencyCode)
    ? (currency as ExpenseCurrencyCode)
    : defaultExpenseCurrency;
}

export function expenseRowToSnapshot(row: {
  section: ExpenseSection;
  status: ExpenseStatus;
  title: string;
  notes: string | null;
  amount: { toString(): string };
  currency: string;
  incurredOn: Date;
  categoryId: string | null;
  expenseTags: { tagId: string }[];
}): ExpenseScalarSnapshot {
  return {
    section: row.section,
    status: row.status,
    title: row.title,
    notes: row.notes,
    amount: row.amount.toString(),
    currency: toExpenseCurrencyCode(row.currency),
    incurredOn: toYmd(row.incurredOn),
    categoryId: row.categoryId,
    tagIds: row.expenseTags.map((t) => t.tagId).sort(),
  };
}

export function buildExpenseHistoryRows(args: {
  expenseId: string;
  batchId: string;
  changedById: string;
  before: ExpenseScalarSnapshot;
  after: ExpenseScalarSnapshot;
}): Prisma.ExpenseHistoryCreateManyInput[] {
  const rows: Prisma.ExpenseHistoryCreateManyInput[] = [];
  const keys: (keyof ExpenseScalarSnapshot)[] = [
    "section",
    "status",
    "title",
    "notes",
    "amount",
    "currency",
    "incurredOn",
    "categoryId",
    "tagIds",
  ];

  for (const key of keys) {
    const prev = args.before[key];
    const next = args.after[key];
    const same =
      key === "tagIds"
        ? JSON.stringify(prev) === JSON.stringify(next)
        : prev === next;
    if (same) continue;
    rows.push({
      expenseId: args.expenseId,
      batchId: args.batchId,
      fieldKey: key,
      oldValue: json(prev),
      newValue: json(next),
      changedById: args.changedById,
    });
  }

  return rows;
}
