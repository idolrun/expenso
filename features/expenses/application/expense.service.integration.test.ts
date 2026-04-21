import { describe, expect, it } from "vitest";

import { UserRole } from "@/app/generated/prisma/client";
import { softDeleteExpenseService } from "@/features/expenses/application/expense.service";

const RUN =
  process.env.RUN_DB_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!RUN)("expense.service (integration)", () => {
  it("blocks soft delete for USER even when expense is missing", async () => {
    const res = await softDeleteExpenseService(
      { id: "nonexistentid00000000000001" },
      "00000000-0000-4000-8000-000000000001",
      UserRole.USER,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("FORBIDDEN");
    }
  });

});
