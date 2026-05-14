import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetByEmail,
  mockGetById,
  mockCreate,
  mockUpdate,
  mockAuditCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetByEmail: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockAuditCreate: vi.fn(),
  mockTransaction: vi.fn(async (callback: (tx: object) => unknown) =>
    callback({ session: { deleteMany: vi.fn() } }),
  ),
}));

vi.mock("@/features/allowed-emails/infrastructure/allowed-email.repository", () => ({
  allowedEmailRepository: {
    list: vi.fn(),
    getById: mockGetById,
    getByEmail: mockGetByEmail,
    create: mockCreate,
    update: mockUpdate,
  },
}));

vi.mock("@/features/audit/infrastructure/audit-log.repository", () => ({
  auditLogRepository: {
    create: mockAuditCreate,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
  },
}));

import {
  createAllowedEmail,
  deactivateAllowedEmail,
} from "@/features/allowed-emails/application/allowed-email.service";

const actorUserId = "00000000-0000-4000-8000-000000000001";

function allowedEmailRow(overrides: Partial<ReturnType<typeof baseAllowedEmailRow>> = {}) {
  return { ...baseAllowedEmailRow(), ...overrides };
}

function baseAllowedEmailRow() {
  return {
    id: "00000000-0000-4000-8000-000000000002",
    email: "person@example.com",
    note: null,
    isActive: true,
    createdById: actorUserId,
    createdBy: { name: "Admin", email: "admin@example.com" },
    updatedById: null,
    updatedBy: null,
    createdAt: new Date("2026-04-27T00:00:00.000Z"),
    updatedAt: new Date("2026-04-27T00:00:00.000Z"),
  };
}

describe("allowed email service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockTransaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ session: { deleteMany: vi.fn() } }),
    );
  });

  it("creates an allowed email and writes an audit log", async () => {
    const created = allowedEmailRow();
    mockGetByEmail.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce(created);
    mockAuditCreate.mockResolvedValueOnce({ id: "audit_1" });

    const result = await createAllowedEmail(actorUserId, {
      email: "Person@Example.com",
      isActive: true,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        ...created,
        createdAt: "2026-04-27T00:00:00.000Z",
        updatedAt: "2026-04-27T00:00:00.000Z",
      },
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: "person@example.com",
        createdById: actorUserId,
      }),
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "ALLOWED_EMAIL_CREATED",
        entityType: "AllowedEmail",
        entityId: created.id,
        actor: { connect: { id: actorUserId } },
      }),
    );
  });

  it("does not create duplicates", async () => {
    mockGetByEmail.mockResolvedValueOnce({ id: "existing" });

    const result = await createAllowedEmail(actorUserId, {
      email: "person@example.com",
      isActive: true,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "DUPLICATE_EMAIL",
        message: "This email is already in the allowlist.",
      },
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });

  it("deactivates an allowed email and writes an audit log", async () => {
    const existing = allowedEmailRow({ isActive: true });
    mockGetById.mockResolvedValueOnce(existing);
    mockUpdate.mockResolvedValueOnce({ ...existing, isActive: false });
    mockAuditCreate.mockResolvedValueOnce({ id: "audit_1" });

    const result = await deactivateAllowedEmail(actorUserId, { id: existing.id });

    expect(result).toEqual({ ok: true, data: { id: existing.id } });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      existing.id,
      expect.objectContaining({ isActive: false }),
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "ALLOWED_EMAIL_DEACTIVATED",
        entityType: "AllowedEmail",
        entityId: existing.id,
        metadata: { email: existing.email, wasActive: true },
      }),
    );
  });
});
