import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

import { getSession } from "@/lib/auth/session";
import {
  createExpenseAction,
  deleteExpenseAction,
} from "@/features/expenses/actions/expense-actions";

describe("expense server actions", () => {
  it("createExpenseAction rejects unauthenticated callers", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await createExpenseAction({
      section: "TECH",
      title: "X",
      amount: "10",
      currency: "USD",
      incurredOn: "2025-01-01",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("deleteExpenseAction forbids USER role", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 99, role: "USER" },
      session: {},
    } as never);
    const res = await deleteExpenseAction({ id: "abcd1234" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("FORBIDDEN");
    }
  });
});
