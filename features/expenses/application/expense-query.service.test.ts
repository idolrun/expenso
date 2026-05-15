import { describe, expect, it } from "vitest";

import { buildExpenseListWhere } from "@/features/expenses/application/expense-query.service";
import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";

function parseListQuery(
  raw: Record<string, unknown>,
): ReturnType<typeof listExpensesQuerySchema.parse> {
  return listExpensesQuerySchema.parse(raw);
}

describe("buildExpenseListWhere", () => {
  it("does not add a section filter when section is OVERVIEW (all sections)", () => {
    const query = parseListQuery({
      section: "OVERVIEW",
      page: 1,
      pageSize: 20,
    });
    const where = buildExpenseListWhere(query);
    const and = where.AND as object[];
    expect(and).toBeDefined();
    expect(and.some((clause) => "section" in clause)).toBe(false);
  });

  it("filters by section for non-overview sections", () => {
    const query = parseListQuery({
      section: "PETTY_CASH",
      page: 1,
      pageSize: 20,
    });
    const where = buildExpenseListWhere(query);
    const and = where.AND as object[];
    expect(and).toContainEqual({ section: "PETTY_CASH" });
  });
});
