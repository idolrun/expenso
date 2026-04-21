import { describe, expect, it } from "vitest";

import { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";
import {
  buildExpenseHistoryRows,
  expenseRowToSnapshot,
} from "@/features/expenses/application/expense-history.builder";

describe("expenseRowToSnapshot", () => {
  it("normalizes amount and tag order", () => {
    const snap = expenseRowToSnapshot({
      section: ExpenseSection.TECH,
      status: ExpenseStatus.DRAFT,
      title: "AWS bill",
      notes: null,
      amount: { toString: () => "120.5000" },
      currency: "usd",
      incurredOn: new Date("2025-06-15T00:00:00.000Z"),
      categoryId: "cat1",
      expenseTags: [{ tagId: "b" }, { tagId: "a" }],
    });
    expect(snap.amount).toBe("120.5000");
    expect(snap.tagIds).toEqual(["a", "b"]);
    expect(snap.incurredOn).toBe("2025-06-15");
  });
});

describe("buildExpenseHistoryRows", () => {
  const base = (): Parameters<typeof expenseRowToSnapshot>[0] => ({
    section: ExpenseSection.TECH,
    status: ExpenseStatus.DRAFT,
    title: "T",
    notes: null,
    amount: { toString: () => "10" },
    currency: "USD",
    incurredOn: new Date("2025-01-01T00:00:00.000Z"),
    categoryId: null,
    expenseTags: [],
  });

  it("emits rows only for changed fields", () => {
    const before = expenseRowToSnapshot(base());
    const after = expenseRowToSnapshot({
      ...base(),
      title: "Updated",
      amount: { toString: () => "12" },
    });
    const rows = buildExpenseHistoryRows({
      expenseId: "exp1",
      batchId: "batch1",
      changedById: 1,
      before,
      after,
    });
    expect(rows).toHaveLength(2);
    const keys = new Set(rows.map((r) => r.fieldKey));
    expect(keys.has("title")).toBe(true);
    expect(keys.has("amount")).toBe(true);
  });

  it("detects tag set changes", () => {
    const before = expenseRowToSnapshot({
      ...base(),
      expenseTags: [{ tagId: "a" }],
    });
    const after = expenseRowToSnapshot({
      ...base(),
      expenseTags: [{ tagId: "a" }, { tagId: "b" }],
    });
    const rows = buildExpenseHistoryRows({
      expenseId: "exp1",
      batchId: "batch1",
      changedById: 2,
      before,
      after,
    });
    expect(rows.some((r) => r.fieldKey === "tagIds")).toBe(true);
  });
});
