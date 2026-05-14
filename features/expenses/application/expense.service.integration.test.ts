import { describe, expect, it } from "vitest";

import { archiveExpenseService } from "@/features/expenses/application/expense.service";

const RUN =
  process.env.RUN_DB_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!RUN)("expense.service (integration)", () => {
  it("allows any authenticated user to archive (returns NOT_FOUND for missing expense)", async () => {
    const res = await archiveExpenseService(
      { id: "nonexistentid00000000000001" },
      "00000000-0000-4000-8000-000000000001",
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("NOT_FOUND");
    }
  });
});
