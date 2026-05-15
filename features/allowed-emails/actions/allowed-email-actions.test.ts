import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSession,
  mockListAllowedEmails,
  mockCreateAllowedEmail,
  mockUpdateAllowedEmail,
  mockDeactivateAllowedEmail,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockListAllowedEmails: vi.fn(),
  mockCreateAllowedEmail: vi.fn(),
  mockUpdateAllowedEmail: vi.fn(),
  mockDeactivateAllowedEmail: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
  parseUserRole: () => "USER",
}));

vi.mock("@/features/allowed-emails/application/allowed-email.service", () => ({
  listAllowedEmails: mockListAllowedEmails,
  createAllowedEmail: mockCreateAllowedEmail,
  updateAllowedEmail: mockUpdateAllowedEmail,
  deactivateAllowedEmail: mockDeactivateAllowedEmail,
}));

import {
  createAllowedEmailAction,
  deactivateAllowedEmailAction,
  listAllowedEmailsAction,
  updateAllowedEmailAction,
} from "@/features/allowed-emails/actions/allowed-email-actions";

const actorUserId = "00000000-0000-4000-8000-000000000001";

function sessionUser() {
  return {
    user: { id: actorUserId, role: "USER" },
    session: {},
  } as never;
}

describe("allowed email actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("allows USER to list allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser());
    mockListAllowedEmails.mockResolvedValueOnce({ ok: true, data: [] });

    const result = await listAllowedEmailsAction();

    expect(result.ok).toBe(true);
    expect(mockListAllowedEmails).toHaveBeenCalledTimes(1);
  });

  it("allows USER to create allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser());
    mockCreateAllowedEmail.mockResolvedValueOnce({
      ok: true,
      data: { id: "allowed_1" },
    });

    const result = await createAllowedEmailAction({
      email: "person@example.com",
      isActive: true,
    });

    expect(result.ok).toBe(true);
    expect(mockCreateAllowedEmail).toHaveBeenCalledWith(actorUserId, {
      email: "person@example.com",
      isActive: true,
    });
  });

  it("allows USER to update allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser());
    mockUpdateAllowedEmail.mockResolvedValueOnce({
      ok: true,
      data: { id: "00000000-0000-4000-8000-000000000002" },
    });

    const result = await updateAllowedEmailAction({
      id: "00000000-0000-4000-8000-000000000002",
      email: "person@example.com",
      isActive: false,
    });

    expect(result.ok).toBe(true);
    expect(mockUpdateAllowedEmail).toHaveBeenCalledWith(actorUserId, {
      id: "00000000-0000-4000-8000-000000000002",
      email: "person@example.com",
      isActive: false,
    });
  });

  it("allows USER to deactivate allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser());
    mockDeactivateAllowedEmail.mockResolvedValueOnce({
      ok: true,
      data: { id: "00000000-0000-4000-8000-000000000002" },
    });

    const result = await deactivateAllowedEmailAction({
      id: "00000000-0000-4000-8000-000000000002",
    });

    expect(result.ok).toBe(true);
    expect(mockDeactivateAllowedEmail).toHaveBeenCalledWith(actorUserId, {
      id: "00000000-0000-4000-8000-000000000002",
    });
  });

  it("returns unauthorized when there is no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const result = await listAllowedEmailsAction();

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    });
    expect(mockListAllowedEmails).not.toHaveBeenCalled();
  });
});
