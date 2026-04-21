import { describe, expect, it } from "vitest";

import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "@/features/expenses/validation/expense";

describe("createExpenseSchema", () => {
  it("accepts a valid payload", () => {
    const r = createExpenseSchema.safeParse({
      section: "TECH",
      title: "Laptop",
      amount: "1299.99",
      currency: "usd",
      incurredOn: "2025-04-01",
      tagIds: [],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.currency).toBe("USD");
    }
  });

  it("rejects invalid money", () => {
    const r = createExpenseSchema.safeParse({
      section: "TECH",
      title: "X",
      amount: "0",
      currency: "USD",
      incurredOn: "2025-04-01",
    });
    expect(r.success).toBe(false);
  });
});

describe("updateExpenseSchema", () => {
  it("requires at least one mutable field", () => {
    const r = updateExpenseSchema.safeParse({ id: "clh1234567890123456789012" });
    expect(r.success).toBe(false);
  });
});

describe("listExpensesQuerySchema", () => {
  it("parses tagIds from comma-separated string", () => {
    const r = listExpensesQuerySchema.safeParse({
      tagIds: "seedtag1,seedtag2",
      page: "2",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tagIds).toEqual(["seedtag1", "seedtag2"]);
      expect(r.data.page).toBe(2);
    }
  });

  it("parses tagIds from repeated-style string arrays", () => {
    const r = listExpensesQuerySchema.safeParse({
      tagIds: ["seedtag1", "seedtag2"],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tagIds).toEqual(["seedtag1", "seedtag2"]);
    }
  });

  it("merges comma-separated entries inside arrays", () => {
    const r = listExpensesQuerySchema.safeParse({
      tagIds: ["seedtag1,seedtag3", "seedtag2"],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tagIds).toEqual(["seedtag1", "seedtag3", "seedtag2"]);
    }
  });

  it("parses merged object state using output-shaped tagIds (no Zod throw)", () => {
    const first = listExpensesQuerySchema.safeParse({
      tagIds: "seedtag1,seedtag2",
    });
    expect(first.success).toBe(true);
    if (!first.success) return;

    const merged = listExpensesQuerySchema.safeParse({
      ...first.data,
      page: 5,
    });
    expect(merged.success).toBe(true);
    if (merged.success) {
      expect(merged.data.tagIds).toEqual(["seedtag1", "seedtag2"]);
      expect(merged.data.page).toBe(5);
    }
  });

  it("rejects inverted amount range", () => {
    const r = listExpensesQuerySchema.safeParse({
      amountMin: "100",
      amountMax: "50",
    });
    expect(r.success).toBe(false);
  });
});
