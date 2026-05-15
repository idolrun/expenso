import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSession, mockAdminListUsers } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockAdminListUsers: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
  parseUserRole: () => "USER",
}));

vi.mock("@/features/users/application/user-admin.service", () => ({
  adminListUsers: mockAdminListUsers,
}));

import { listUsersAction } from "@/features/users/actions/user-actions";

describe("user actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists users when the session has view-users permission", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "00000000-0000-4000-8000-000000000001", role: "USER" },
      session: {},
    } as never);
    mockAdminListUsers.mockResolvedValueOnce({ ok: true, data: [] });

    const result = await listUsersAction();

    expect(result).toEqual({ ok: true, data: [] });
    expect(mockAdminListUsers).toHaveBeenCalledTimes(1);
  });

  it("returns unauthorized when there is no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const result = await listUsersAction();

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    });
    expect(mockAdminListUsers).not.toHaveBeenCalled();
  });
});
