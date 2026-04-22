import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";

import { Prisma } from "@/app/generated/prisma/client";
import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

import type { DashboardActivityItemDto, DashboardSummaryDto } from "@/features/dashboard/domain/types";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import { serializeExpense, serializeExpenseHistoryRow } from "@/features/expenses/domain/serialize";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { getAllActiveBudgetSummariesService } from "@/features/budgets/application/budget.service";
import { prisma } from "@/lib/prisma";

const activeUsdWhere = { deletedAt: null, originalCurrency: "USD" } as const;
const activeNprWhere = { deletedAt: null, originalCurrency: "NPR" } as const;

function userLabel(
  user: { name: string | null; email: string } | null | undefined,
  fallbackId: string | null,
): string | null {
  if (!fallbackId && !user) return null;
  if (!user) return fallbackId ? `user ${fallbackId.slice(0, 8)}…` : null;
  return user.name?.trim() || user.email || (fallbackId ? `user ${fallbackId.slice(0, 8)}…` : null);
}

/**
 * Merge NPR spend from two groupBy result sets:
 *   1. Direct NPR expenses (originalAmount where originalCurrency=NPR)
 *   2. USD expenses with FX snapshots (amountNpr where originalCurrency=USD, amountNpr != null)
 */
function mergeNprSectionSpend(
  directRows: { section: ExpenseSection; _sum: { originalAmount: Prisma.Decimal | null } }[],
  snapshotRows: { section: ExpenseSection; _sum: { amountNpr: Prisma.Decimal | null } }[],
): Partial<Record<ExpenseSection, string>> {
  const map = new Map<ExpenseSection, Prisma.Decimal>();

  for (const row of directRows) {
    if (row._sum.originalAmount) {
      map.set(row.section, row._sum.originalAmount);
    }
  }
  for (const row of snapshotRows) {
    if (row._sum.amountNpr) {
      const prev = map.get(row.section) ?? new Prisma.Decimal(0);
      map.set(row.section, prev.add(row._sum.amountNpr));
    }
  }

  const result: Partial<Record<ExpenseSection, string>> = {};
  for (const [section, dec] of map.entries()) {
    result[section] = dec.toString();
  }
  return result;
}

export async function getDashboardSummary(): Promise<
  ServiceResult<DashboardSummaryDto>
> {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthRangeSpecs = Array.from({ length: 6 }, (_, j) => {
      const i = 5 - j;
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      return {
        monthKey: format(start, "yyyy-MM"),
        label: format(start, "MMM yyyy"),
        start,
        end,
      };
    });

    const sectionBreakdownSpecs = [
      { key: "1m" as const, start: monthStart, end: monthEnd },
      { key: "2m" as const, start: startOfMonth(subMonths(now, 1)), end: monthEnd },
      { key: "3m" as const, start: startOfMonth(subMonths(now, 2)), end: monthEnd },
    ];

    const budgetSummariesPromise = getAllActiveBudgetSummariesService(now, "USD");

    const [
      totalCount,
      totalSpendAgg,
      monthSpendAgg,
      // NPR: direct expenses in NPR
      nprTotalDirectAgg,
      nprMonthDirectAgg,
      // NPR: USD expenses with stored amountNpr snapshot
      nprTotalSnapshotAgg,
      nprMonthSnapshotAgg,
      statusGroups,
      sectionCountGroups,
      sectionSpendGroups,
      // NPR section breakdown
      nprSectionDirectGroups,
      nprSectionSnapshotGroups,
      recentRows,
      historyRows,
      historyFeed,
      auditFeed,
      sectionBreakdown1m,
      sectionBreakdown2m,
      sectionBreakdown3m,
      ...monthAggs
    ] = await Promise.all([
      prisma.expense.count({ where: { deletedAt: null } }),
      prisma.expense.aggregate({ where: activeUsdWhere, _sum: { originalAmount: true } }),
      prisma.expense.aggregate({
        where: { ...activeUsdWhere, incurredOn: { gte: monthStart, lte: monthEnd } },
        _sum: { originalAmount: true },
      }),
      // NPR direct totals
      prisma.expense.aggregate({ where: activeNprWhere, _sum: { originalAmount: true } }),
      prisma.expense.aggregate({
        where: { ...activeNprWhere, incurredOn: { gte: monthStart, lte: monthEnd } },
        _sum: { originalAmount: true },
      }),
      // NPR via FX snapshot on USD expenses
      prisma.expense.aggregate({
        where: { ...activeUsdWhere, amountNpr: { not: null } },
        _sum: { amountNpr: true },
      }),
      prisma.expense.aggregate({
        where: {
          ...activeUsdWhere,
          amountNpr: { not: null },
          incurredOn: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountNpr: true },
      }),
      prisma.expense.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.expense.groupBy({ by: ["section"], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.expense.groupBy({ by: ["section"], where: activeUsdWhere, _sum: { originalAmount: true } }),
      // NPR section breakdown
      prisma.expense.groupBy({ by: ["section"], where: activeNprWhere, _sum: { originalAmount: true } }),
      prisma.expense.groupBy({
        by: ["section"],
        where: { ...activeUsdWhere, amountNpr: { not: null } },
        _sum: { amountNpr: true },
      }),
      expenseRepository.findManyWhere(prisma, {
        where: { deletedAt: null },
        orderBy: [{ updatedAt: "desc" }],
        skip: 0,
        take: 5,
      }),
      prisma.expenseHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          expense: { select: { title: true, section: true } },
          changedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.expenseHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          expense: { select: { id: true, title: true, section: true } },
          changedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { actor: { select: { name: true, email: true } } },
      }),
      ...sectionBreakdownSpecs.map(({ start, end }) =>
        prisma.expense.groupBy({
          by: ["section"],
          where: { ...activeUsdWhere, incurredOn: { gte: start, lte: end } },
          _sum: { originalAmount: true },
        }),
      ),
      ...monthRangeSpecs.map(({ start, end }) =>
        prisma.expense.aggregate({
          where: { ...activeUsdWhere, incurredOn: { gte: start, lte: end } },
          _sum: { originalAmount: true },
        }),
      ),
    ]);

    const budgetSummariesResult = await budgetSummariesPromise;

    // Compute combined NPR totals
    const totalNprDec = (nprTotalDirectAgg._sum.originalAmount ?? new Prisma.Decimal(0)).add(
      nprTotalSnapshotAgg._sum.amountNpr ?? new Prisma.Decimal(0),
    );
    const monthNprDec = (nprMonthDirectAgg._sum.originalAmount ?? new Prisma.Decimal(0)).add(
      nprMonthSnapshotAgg._sum.amountNpr ?? new Prisma.Decimal(0),
    );

    const monthlySpendUsdLast6 = monthRangeSpecs.map((spec, idx) => ({
      monthKey: spec.monthKey,
      label: spec.label,
      amount:
        (monthAggs[idx] as { _sum: { originalAmount: { toString(): string } | null } } | undefined)
          ?._sum.originalAmount?.toString() ?? "0",
    }));
    const previousMonthSpendUsd = monthlySpendUsdLast6[4]?.amount ?? "0";

    const byStatus: Partial<Record<ExpenseStatus, number>> = {};
    for (const row of statusGroups) byStatus[row.status] = row._count._all;

    const bySection: Partial<Record<ExpenseSection, number>> = {};
    for (const row of sectionCountGroups) bySection[row.section] = row._count._all;

    const spendBySectionUsd: Partial<Record<ExpenseSection, string>> = {};
    for (const row of sectionSpendGroups) {
      spendBySectionUsd[row.section] = row._sum.originalAmount?.toString() ?? "0";
    }

    const mapSectionSpend = (
      rows: { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[],
    ): Partial<Record<ExpenseSection, string>> => {
      const m: Partial<Record<ExpenseSection, string>> = {};
      for (const row of rows) m[row.section] = row._sum.originalAmount?.toString() ?? "0";
      return m;
    };

    const spendBySectionNpr = mergeNprSectionSpend(
      nprSectionDirectGroups as { section: ExpenseSection; _sum: { originalAmount: Prisma.Decimal | null } }[],
      nprSectionSnapshotGroups as { section: ExpenseSection; _sum: { amountNpr: Prisma.Decimal | null } }[],
    );

    const recentHistory = historyRows.map((r) => ({
      ...serializeExpenseHistoryRow({
        id: r.id,
        expenseId: r.expenseId,
        batchId: r.batchId,
        fieldKey: r.fieldKey,
        oldValue: r.oldValue,
        newValue: r.newValue,
        changedById: r.changedById,
        createdAt: r.createdAt,
      }),
      changedByLabel: userLabel(r.changedBy, r.changedById) ?? undefined,
      expenseTitle: r.expense.title,
      expenseSection: r.expense.section,
    }));

    const activityCandidates: DashboardActivityItemDto[] = [
      ...historyFeed.map((r) => ({
        kind: "expense_history" as const,
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        expenseId: r.expenseId,
        expenseTitle: r.expense.title,
        section: r.expense.section,
        fieldKey: r.fieldKey,
        changedById: r.changedById,
        changedByLabel: userLabel(r.changedBy, r.changedById) ?? undefined,
      })),
      ...auditFeed.map((r) => ({
        kind: "audit_log" as const,
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        actorId: r.actorId,
        actorLabel: userLabel(r.actor, r.actorId),
      })),
    ];

    activityCandidates.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      ok: true,
      data: {
        totalCount,
        totalSpendUsd: totalSpendAgg._sum.originalAmount?.toString() ?? "0",
        monthSpendUsd: monthSpendAgg._sum.originalAmount?.toString() ?? "0",
        monthlySpendUsdLast6,
        previousMonthSpendUsd,
        totalSpendNpr: totalNprDec.toString(),
        monthSpendNpr: monthNprDec.toString(),
        byStatus,
        bySection,
        spendBySectionUsd,
        spendBySectionUsdByPeriod: {
          "1m": mapSectionSpend(sectionBreakdown1m as { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[]),
          "2m": mapSectionSpend(sectionBreakdown2m as { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[]),
          "3m": mapSectionSpend(sectionBreakdown3m as { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[]),
        },
        spendBySectionNpr,
        recentExpenses: recentRows.map(serializeExpense),
        recentHistory,
        recentActivity: activityCandidates.slice(0, 20),
        sectionBudgetSummaries: budgetSummariesResult.ok ? budgetSummariesResult.data : [],
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Dashboard summary failed";
    return { ok: false, error: { code: "DASHBOARD_SUMMARY_FAILED", message } };
  }
}
