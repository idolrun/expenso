import type { Prisma } from "@/generated/prisma/client";
import type { ExpenseSection, ExpenseStatus } from "@/generated/prisma/client";
import {
  defaultExpenseCurrency,
  expenseCurrencyValues,
  type ExpenseCurrencyCode,
} from "@/features/expenses/domain/currency";
import { paymentTypeValues } from "@/features/expenses/validation/primitives";
import type { PaymentType } from "@/generated/prisma/client";

export type ExpenseScalarSnapshot = {
  section: ExpenseSection;
  status: ExpenseStatus;
  title: string;
  notes: string | null;
  originalAmount: string;
  originalCurrency: ExpenseCurrencyCode;
  fromDate: string;
  toDate: string;
  paymentType: PaymentType;
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

function toPaymentType(paymentType: string): PaymentType {
  return paymentTypeValues.includes(paymentType as PaymentType)
    ? (paymentType as PaymentType)
    : "OTHER";
}

export function expenseRowToSnapshot(row: {
  section: ExpenseSection;
  status: ExpenseStatus;
  title: string;
  notes: string | null;
  originalAmount: { toString(): string };
  originalCurrency: string;
  fromDate: Date;
  toDate: Date;
  paymentType: string;
  expenseTags: { tagId: string }[];
}): ExpenseScalarSnapshot {
  return {
    section: row.section,
    status: row.status,
    title: row.title,
    notes: row.notes,
    originalAmount: row.originalAmount.toString(),
    originalCurrency: toExpenseCurrencyCode(row.originalCurrency),
    fromDate: toYmd(row.fromDate),
    toDate: toYmd(row.toDate),
    paymentType: toPaymentType(row.paymentType),
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
    "originalAmount",
    "originalCurrency",
    "fromDate",
    "toDate",
    "paymentType",
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
