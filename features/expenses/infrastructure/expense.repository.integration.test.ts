import { describe, expect, it } from "vitest";

import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { prisma } from "@/lib/prisma";

const RUN =
  process.env.RUN_DB_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!RUN)("expense.repository (integration)", () => {
  it("counts active expenses without throwing", async () => {
    const n = await expenseRepository.countWhere(prisma, { deletedAt: null });
    expect(typeof n).toBe("number");
    expect(n).toBeGreaterThanOrEqual(0);
  });
});
