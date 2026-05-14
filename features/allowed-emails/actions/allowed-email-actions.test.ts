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
  parseUserRole: (role: unknown) => (role === "ADMIN" ? "ADMIN" : "USER"),
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

function sessionUser(role: "USER" | "ADMIN") {
  return {
    user: { id: "00000000-0000-4000-8000-000000000001", role },
    session: {},
  } as never;
}

describe("allowed email actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("allows USER to list allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("USER"));
    mockListAllowedEmails.mockResolvedValueOnce({ ok: true, data: [] });

    const result = await listAllowedEmailsAction();

    expect(result.ok).toBe(true);
    expect(mockListAllowedEmails).toHaveBeenCalledTimes(1);
  });

  it("allows USER to create allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("USER"));
    mockCreateAllowedEmail.mockResolvedValueOnce({
      ok: true,
      data: { id: "allowed_1" },
    });

    const result = await createAllowedEmailAction({
      email: "person@example.com",
      isActive: true,
    });

    expect(result.ok).toBe(true);
    expect(mockCreateAllowedEmail).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { email: "person@example.com", isActive: true },
    );
  });

  it("allows USER to update allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("USER"));
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
    expect(mockUpdateAllowedEmail).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      {
        id: "00000000-0000-4000-8000-000000000002",
        email: "person@example.com",
        isActive: false,
      },
    );
  });

  it("allows USER to deactivate allowed emails", async () => {
    mockGetSession.mockResolvedValueOnce(sessionUser("USER"));
    mockDeactivateAllowedEmail.mockResolvedValueOnce({
      ok: true,
      data: { id: "00000000-0000-4000-8000-000000000002" },
    });

    const result = await deactivateAllowedEmailAction({
      id: "00000000-0000-4000-8000-000000000002",
    });

    expect(result.ok).toBe(true);
    expect(mockDeactivateAllowedEmail).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { id: "00000000-0000-4000-8000-000000000002" },
    );
  });
});
