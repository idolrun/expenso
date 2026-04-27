import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSession,
  mockAdminListUsers,
  mockAdminSetUserRole,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockAdminListUsers: vi.fn(),
  mockAdminSetUserRole: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
  parseUserRole: (role: unknown) => (role === "ADMIN" ? "ADMIN" : "USER"),
}));

vi.mock("@/features/users/application/user-admin.service", () => ({
  adminListUsers: mockAdminListUsers,
  adminSetUserRole: mockAdminSetUserRole,
}));

import {
  listUsersAction,
  updateUserRoleAction,
} from "@/features/users/actions/user-actions";

const actorUserId = "00000000-0000-4000-8000-000000000001";

function sessionUser(role: "USER" | "ADMIN") {
  return {
    user: { id: actorUserId, role },
    session: {},
  } as never;
}

describe("user actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists users with the actor role so USER callers cannot see admins", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("USER"));
    mockAdminListUsers.mockResolvedValueOnce({ ok: true, data: [] });

    const result = await listUsersAction();

    expect(result).toEqual({ ok: true, data: [] });
    expect(mockAdminListUsers).toHaveBeenCalledWith("USER");
  });

  it("lists users with ADMIN visibility for admin callers", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("ADMIN"));
    mockAdminListUsers.mockResolvedValueOnce({ ok: true, data: [] });

    const result = await listUsersAction();

    expect(result).toEqual({ ok: true, data: [] });
    expect(mockAdminListUsers).toHaveBeenCalledWith("ADMIN");
  });

  it("passes USER role to role-update service so non-admin updates are blocked there", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("USER"));
    mockAdminSetUserRole.mockResolvedValueOnce({
      ok: false,
      error: { code: "FORBIDDEN", message: "Admin only" },
    });

    const result = await updateUserRoleAction({
      userId: "00000000-0000-4000-8000-000000000002",
      role: "ADMIN",
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
    expect(mockAdminSetUserRole).toHaveBeenCalledWith(
      "USER",
      actorUserId,
      {
        userId: "00000000-0000-4000-8000-000000000002",
        role: "ADMIN",
      },
    );
  });
});
