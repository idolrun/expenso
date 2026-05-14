import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  parseUserRole: (role: unknown) => (role === "ADMIN" ? "ADMIN" : "USER"),
}));

import { getSession } from "@/lib/auth/session";
import {
  createExpenseAction,
  archiveExpenseAction,
} from "@/features/expenses/actions/expense-actions";

describe("expense server actions", () => {
  it("createExpenseAction rejects unauthenticated callers", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await createExpenseAction({
      section: "TECH",
      title: "X",
      amount: "10",
      currency: "USD",
      fromDate: "2025-01-01",
      toDate: "2025-01-01",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("archiveExpenseAction allows any authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: "00000000-0000-4000-8000-000000000099", role: "USER" },
      session: {},
    } as never);
    // archiveExpenseAction will fail with NOT_FOUND because the expense doesn't exist,
    // but it should NOT fail with FORBIDDEN — proving the permission gate is removed.
    const res = await archiveExpenseAction({ id: "nonexistentid00000000000001" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).not.toBe("FORBIDDEN");
    }
  });
});
