import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  parseUserRole: (role: unknown) => (role === "ADMIN" ? "ADMIN" : "USER"),
}));

vi.mock("@/features/expenses/application/expense-query.service", () => ({
  listExpenses: vi.fn(),
  getExpenseById: vi.fn(),
}));

vi.mock("@/features/expenses/application/expense-search.service", () => ({
  globalSearchExpenses: vi.fn(),
}));

vi.mock("@/features/audit/application/audit-query.service", () => ({
  listAuditLogs: vi.fn(),
}));

vi.mock("@/features/dashboard/application/dashboard-summary.service", () => ({
  getDashboardSummary: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";
import { getExpenseById, listExpenses } from "@/features/expenses/application/expense-query.service";
import { globalSearchExpenses } from "@/features/expenses/application/expense-search.service";
import { listAuditLogs } from "@/features/audit/application/audit-query.service";
import { getDashboardSummary } from "@/features/dashboard/application/dashboard-summary.service";

import { GET as getExpensesList } from "@/src/app/api/expenses/route";
import { GET as getExpenseByIdRoute } from "@/src/app/api/expenses/[id]/route";
import { GET as getSearch } from "@/src/app/api/search/route";
import { GET as getAuditLog } from "@/src/app/api/audit-log/route";
import { GET as getDashboard } from "@/src/app/api/dashboard/route";

function sessionUser(
  role: "USER" | "ADMIN",
  id = "00000000-0000-4000-8000-000000000001",
) {
  return {
    user: { id, role },
    session: {},
  } as never;
}

describe("GET /api/expenses", () => {
  beforeEach(() => {
    vi.mocked(listExpenses).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new NextRequest("http://localhost/api/expenses");
    const res = await getExpensesList(req);
    expect(res.status).toBe(401);
    expect(listExpenses).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid list query when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    const req = new NextRequest("http://localhost/api/expenses?section=NOT_A_SECTION");
    const res = await getExpensesList(req);
    expect(res.status).toBe(400);
    expect(listExpenses).not.toHaveBeenCalled();
  });

  it("calls listExpenses and returns 200 on success", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("ADMIN"));
    vi.mocked(listExpenses).mockResolvedValueOnce({
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    const req = new NextRequest("http://localhost/api/expenses");
    const res = await getExpensesList(req);
    expect(res.status).toBe(200);
    expect(listExpenses).toHaveBeenCalledTimes(1);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe("GET /api/expenses/[id]", () => {
  beforeEach(() => {
    vi.mocked(getExpenseById).mockReset();
  });

  it("returns 400 for blank id", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    const req = new NextRequest("http://localhost/api/expenses/   ");
    const res = await getExpenseByIdRoute(req, { params: Promise.resolve({ id: "   " }) });
    expect(res.status).toBe(400);
    expect(getExpenseById).not.toHaveBeenCalled();
  });

  it("returns 404 when service reports not found", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    vi.mocked(getExpenseById).mockResolvedValueOnce({
      ok: false,
      error: { code: "NOT_FOUND", message: "Expense not found" },
    });
    const req = new NextRequest("http://localhost/api/expenses/exp123");
    const res = await getExpenseByIdRoute(req, { params: Promise.resolve({ id: "exp123" }) });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.mocked(globalSearchExpenses).mockReset();
  });

  it("returns 400 when q is too short", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    const req = new NextRequest("http://localhost/api/search?q=a");
    const res = await getSearch(req);
    expect(res.status).toBe(400);
    expect(globalSearchExpenses).not.toHaveBeenCalled();
  });

  it("calls globalSearchExpenses when q is valid", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    vi.mocked(globalSearchExpenses).mockResolvedValueOnce({ ok: true, data: [] });
    const req = new NextRequest("http://localhost/api/search?q=amazon");
    const res = await getSearch(req);
    expect(res.status).toBe(200);
    expect(globalSearchExpenses).toHaveBeenCalledWith(
      expect.objectContaining({ q: "amazon" }),
    );
  });
});

describe("GET /api/audit-log", () => {
  beforeEach(() => {
    vi.mocked(listAuditLogs).mockReset();
  });

  it("returns 403 for non-admin before validation", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    const req = new NextRequest("http://localhost/api/audit-log?page=not-a-number");
    const res = await getAuditLog(req);
    expect(res.status).toBe(403);
    expect(listAuditLogs).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid query when admin", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("ADMIN"));
    const req = new NextRequest("http://localhost/api/audit-log?page=not-a-number");
    const res = await getAuditLog(req);
    expect(res.status).toBe(400);
    expect(listAuditLogs).not.toHaveBeenCalled();
  });

  it("returns 200 when admin and query is valid", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("ADMIN"));
    vi.mocked(listAuditLogs).mockResolvedValueOnce({
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    const req = new NextRequest("http://localhost/api/audit-log");
    const res = await getAuditLog(req);
    expect(res.status).toBe(200);
    expect(listAuditLogs).toHaveBeenCalled();
  });
});

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.mocked(getDashboardSummary).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await getDashboard();
    expect(res.status).toBe(401);
    expect(getDashboardSummary).not.toHaveBeenCalled();
  });

  it("returns 200 when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(sessionUser("USER"));
    vi.mocked(getDashboardSummary).mockResolvedValueOnce({
      ok: true,
      data: {
        totalCount: 0,
        totalSpendUsd: "0",
        monthSpendUsd: "0",
        monthlySpendUsdLast6: [],
        previousMonthSpendUsd: "0",
        byStatus: {},
        bySection: {},
        spendBySectionUsd: {},
        spendBySectionUsdByPeriod: {
          "1m": {},
          "2m": {},
          "3m": {},
        },
        totalSpendNpr: "0",
        monthSpendNpr: "0",
        spendBySectionNpr: {},
        recentExpenses: [],
        recentHistory: [],
        recentActivity: [],
      },
    });
    const res = await getDashboard();
    expect(res.status).toBe(200);
    expect(getDashboardSummary).toHaveBeenCalled();
  });
});
