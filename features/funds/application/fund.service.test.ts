import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFundEntrySchema } from "@/features/funds/validation/fund";

const {
  mockCreate,
  mockFindAll,
  mockFindById,
  mockGetSummary,
  mockAuditLogCreate,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockGetSummary: vi.fn(),
  mockAuditLogCreate: vi.fn(),
}));

vi.mock("@/features/funds/infrastructure/fund.repository", () => ({
  fundRepository: {
    create: mockCreate,
    findAll: mockFindAll,
    findById: mockFindById,
    getSummary: mockGetSummary,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: mockAuditLogCreate,
    },
  },
}));

import { fundService } from "@/features/funds/application/fund.service";

describe("fundService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("create: valid input calls repository, writes audit log, and returns entry", async () => {
    const dto = {
      amount: 1200.5,
      currency: "USD" as const,
      source: "BANK_TRANSFER" as const,
      sourceLabel: "Primary account",
      note: "April allocation",
      receivedAt: new Date("2026-04-26T00:00:00.000Z"),
    };
    const created = {
      id: "fund_1",
      amount: "1200.5000",
      currency: "USD" as const,
      source: "BANK_TRANSFER" as const,
      sourceLabel: "Primary account",
      note: "April allocation",
      receivedAt: new Date("2026-04-26T00:00:00.000Z"),
      createdById: "00000000-0000-4000-8000-000000000001",
      createdBy: {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Test User",
        email: "test@example.com",
      },
      createdAt: new Date("2026-04-26T00:01:00.000Z"),
    };

    mockCreate.mockResolvedValueOnce(created);
    mockAuditLogCreate.mockResolvedValueOnce({ id: "audit_1" });

    const result = await fundService.create(
      dto,
      "00000000-0000-4000-8000-000000000001",
    );

    expect(mockCreate).toHaveBeenCalledWith({
      ...dto,
      createdById: "00000000-0000-4000-8000-000000000001",
    });
    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "FUNDENTRYCREATED",
        entityType: "FundEntry",
        entityId: "fund_1",
        actorId: "00000000-0000-4000-8000-000000000001",
      }),
    });
    expect(result).toEqual(created);
  });

  it("create: invalid amount (negative) throws validation error before repository", () => {
    expect(() =>
      createFundEntrySchema.parse({
        amount: -100,
        currency: "USD",
        source: "CASH",
        receivedAt: "2026-04-26",
      }),
    ).toThrow();

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("list: passes filters to repository", async () => {
    const filters = {
      createdById: "00000000-0000-4000-8000-000000000002",
      source: "CASH" as const,
      currency: "NPR" as const,
      amountMin: 100,
      amountMax: 500,
      dateFrom: new Date("2026-01-01T00:00:00.000Z"),
      dateTo: new Date("2026-01-31T00:00:00.000Z"),
      page: 1,
      limit: 20,
    };

    mockFindAll.mockResolvedValueOnce({ entries: [], total: 0 });

    const result = await fundService.list(filters);

    expect(mockFindAll).toHaveBeenCalledWith(filters);
    expect(result).toEqual({ entries: [], total: 0 });
  });

  it("getSummary: returns FundSummary shape", async () => {
    const summary = {
      totalUSD: "123.4500",
      totalNPR: "1000.0000",
      entryCount: 2,
      latestFive: [],
    };

    mockGetSummary.mockResolvedValueOnce(summary);

    const result = await fundService.getSummary();

    expect(result).toEqual(summary);
    expect(typeof result.totalUSD).toBe("string");
    expect(typeof result.totalNPR).toBe("string");
    expect(typeof result.entryCount).toBe("number");
    expect(Array.isArray(result.latestFive)).toBe(true);
  });
});
