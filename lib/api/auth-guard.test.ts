import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

import { getSession } from "@/lib/auth/session";
import { requireAuditReader, requireExpenseReader } from "@/lib/api/auth-guard";

describe("requireExpenseReader", () => {
  it("returns 401 when there is no session", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await requireExpenseReader();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
    }
  });

  it("allows USER with read permission", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: "00000000-0000-4000-8000-000000000001", role: "USER" },
      session: {},
    } as never);
    const res = await requireExpenseReader();
    expect(res.ok).toBe(true);
  });
});

describe("requireAuditReader", () => {
  it("returns 403 for non-admin", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: "00000000-0000-4000-8000-000000000001", role: "USER" },
      session: {},
    } as never);
    const res = await requireAuditReader();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(403);
    }
  });

  it("allows ADMIN", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: "00000000-0000-4000-8000-000000000001", role: "ADMIN" },
      session: {},
    } as never);
    const res = await requireAuditReader();
    expect(res.ok).toBe(true);
  });
});
