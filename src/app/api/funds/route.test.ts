import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/api/auth-guard", () => ({
  requireFundReader: vi.fn(),
}));

vi.mock("@/features/funds/application/fund.service", () => ({
  fundService: {
    list: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    getSummary: vi.fn(),
  },
}));

import { requireFundReader } from "@/lib/api/auth-guard";
import { fundService } from "@/features/funds/application/fund.service";
import { GET as getFunds, POST as postFunds } from "@/src/app/api/funds/route";
import { GET as getFundById } from "@/src/app/api/funds/[id]/route";
import { GET as getFundSummary } from "@/src/app/api/funds/summary/route";

function unauthorizedAuthResult() {
  return {
    ok: false as const,
    response: NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    ),
  };
}

function authorizedAuthResult() {
  return {
    ok: true as const,
    session: {
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        role: "USER" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "test@example.com",
        emailVerified: true,
        name: "Test User",
      },
      session: {
        id: "session-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "00000000-0000-4000-8000-000000000001",
        expiresAt: new Date(),
        token: "token",
        ipAddress: null,
        userAgent: null,
      },
    },
    role: "USER" as import("@/app/generated/prisma").UserRole,
    userId: "00000000-0000-4000-8000-000000000001",
  };
}

describe("fund route handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/funds without auth -> 401", async () => {
    vi.mocked(requireFundReader).mockResolvedValueOnce(unauthorizedAuthResult());

    const req = new NextRequest("http://localhost/api/funds");
    const res = await getFunds(req);

    expect(res.status).toBe(401);
    expect(fundService.list).not.toHaveBeenCalled();
  });

  it("GET /api/funds with auth -> 200 and empty list payload", async () => {
    vi.mocked(requireFundReader).mockResolvedValueOnce(authorizedAuthResult());
    vi.mocked(fundService.list).mockResolvedValueOnce({ entries: [], total: 0 });

    const req = new NextRequest("http://localhost/api/funds?page=1&limit=20");
    const res = await getFunds(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: unknown[];
      total: number;
      page: number;
      limit: number;
    };

    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it("POST /api/funds with valid body -> 201", async () => {
    vi.mocked(requireFundReader).mockResolvedValueOnce(authorizedAuthResult());
    vi.mocked(fundService.create).mockResolvedValueOnce({
      id: "fund_1",
      amount: "100.0000",
      currency: "USD",
      source: "CASH",
      sourceLabel: null,
      note: null,
      receivedAt: new Date("2026-04-26T00:00:00.000Z"),
      createdById: "00000000-0000-4000-8000-000000000001",
      createdBy: {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Jane",
        email: "jane@example.com",
      },
      createdAt: new Date("2026-04-26T00:00:00.000Z"),
    });

    const req = new NextRequest("http://localhost/api/funds", {
      method: "POST",
      body: JSON.stringify({
        amount: 100,
        currency: "USD",
        source: "CASH",
        receivedAt: "2026-04-26",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await postFunds(req);

    expect(res.status).toBe(201);
    expect(fundService.create).toHaveBeenCalledTimes(1);
  });

  it("POST /api/funds with invalid body -> 400 and zod errors", async () => {
    vi.mocked(requireFundReader).mockResolvedValueOnce(authorizedAuthResult());

    const req = new NextRequest("http://localhost/api/funds", {
      method: "POST",
      body: JSON.stringify({
        amount: -100,
        currency: "USD",
        source: "CASH",
        receivedAt: "2026-04-26",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await postFunds(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      ok: boolean;
      error: { code: string; issues: unknown };
    };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(fundService.create).not.toHaveBeenCalled();
  });

  it("GET /api/funds/summary with auth -> 200", async () => {
    vi.mocked(requireFundReader).mockResolvedValueOnce(authorizedAuthResult());
    vi.mocked(fundService.getSummary).mockResolvedValueOnce({
      totalUSD: "150.5000",
      totalNPR: "0",
      entryCount: 1,
      latestFive: [],
    });

    const req = new NextRequest("http://localhost/api/funds/summary");
    const res = await getFundSummary(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: {
        totalUSD: string;
        totalNPR: string;
        entryCount: number;
        latestFive: unknown[];
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.totalUSD).toBe("150.5000");
    expect(body.data.totalNPR).toBe("0");
    expect(body.data.entryCount).toBe(1);
    expect(Array.isArray(body.data.latestFive)).toBe(true);
  });

  it("GET /api/funds/nonexistent-id -> 404", async () => {
    vi.mocked(requireFundReader).mockResolvedValueOnce(authorizedAuthResult());
    vi.mocked(fundService.getById).mockRejectedValueOnce(new Error("Fund entry not found"));

    const req = new NextRequest("http://localhost/api/funds/nonexistent-id");
    const res = await getFundById(req, {
      params: Promise.resolve({ id: "nonexistent-id" }),
    });

    expect(res.status).toBe(404);
  });
});
