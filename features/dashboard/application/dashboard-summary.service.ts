import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";

import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

import type { DashboardActivityItemDto, DashboardSummaryDto } from "@/features/dashboard/domain/types";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import { serializeExpense, serializeExpenseHistoryRow } from "@/features/expenses/domain/serialize";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { prisma } from "@/lib/prisma";

/**
 * Base filter for "active USD-denominated expenses".
 * Phase 1: uses originalCurrency filter on originalAmount.
 * Phase 2 note: replace with amountUsd aggregation (non-null check) to include
 * NPR expenses that have been snapshotted, enabling true dual-currency rollups.
 */
const activeUsdWhere = { deletedAt: null, originalCurrency: "USD" } as const;

function userLabel(
  user: { name: string | null; email: string } | null | undefined,
  fallbackId: string | null,
): string | null {
  if (!fallbackId && !user) return null;
  if (!user) return fallbackId ? `user ${fallbackId.slice(0, 8)}…` : null;
  return user.name?.trim() || user.email || (fallbackId ? `user ${fallbackId.slice(0, 8)}…` : null);
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

    const [
      totalCount,
      totalSpendAgg,
      monthSpendAgg,
      statusGroups,
      sectionCountGroups,
      sectionSpendGroups,
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
      prisma.expense.aggregate({
        where: activeUsdWhere,
        _sum: { originalAmount: true },
      }),
      prisma.expense.aggregate({
        where: {
          ...activeUsdWhere,
          incurredOn: { gte: monthStart, lte: monthEnd },
        },
        _sum: { originalAmount: true },
      }),
      prisma.expense.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.expense.groupBy({
        by: ["section"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.expense.groupBy({
        by: ["section"],
        where: activeUsdWhere,
        _sum: { originalAmount: true },
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
        include: {
          actor: { select: { name: true, email: true } },
        },
      }),
      ...sectionBreakdownSpecs.map(({ start, end }) =>
        prisma.expense.groupBy({
          by: ["section"],
          where: {
            ...activeUsdWhere,
            incurredOn: { gte: start, lte: end },
          },
          _sum: { originalAmount: true },
        }),
      ),
      ...monthRangeSpecs.map(({ start, end }) =>
        prisma.expense.aggregate({
          where: {
            ...activeUsdWhere,
            incurredOn: { gte: start, lte: end },
          },
          _sum: { originalAmount: true },
        }),
      ),
    ]);

    const monthlySpendUsdLast6 = monthRangeSpecs.map((spec, idx) => ({
      monthKey: spec.monthKey,
      label: spec.label,
      amount:
        (monthAggs[idx] as { _sum: { originalAmount: { toString(): string } | null } } | undefined)?._sum.originalAmount?.toString() ??
        "0",
    }));
    const previousMonthSpendUsd = monthlySpendUsdLast6[4]?.amount ?? "0";

    const byStatus: Partial<Record<ExpenseStatus, number>> = {};
    for (const row of statusGroups) {
      byStatus[row.status] = row._count._all;
    }

    const bySection: Partial<Record<ExpenseSection, number>> = {};
    for (const row of sectionCountGroups) {
      bySection[row.section] = row._count._all;
    }

    const spendBySectionUsd: Partial<Record<ExpenseSection, string>> = {};
    for (const row of sectionSpendGroups) {
      spendBySectionUsd[row.section] = row._sum.originalAmount?.toString() ?? "0";
    }
    const mapSectionSpend = (
      rows: { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[],
    ): Partial<Record<ExpenseSection, string>> => {
      const mapped: Partial<Record<ExpenseSection, string>> = {};
      for (const row of rows) {
        mapped[row.section] = row._sum.originalAmount?.toString() ?? "0";
      }
      return mapped;
    };
    const spendBySectionUsdByPeriod = {
      "1m": mapSectionSpend(
        sectionBreakdown1m as { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[],
      ),
      "2m": mapSectionSpend(
        sectionBreakdown2m as { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[],
      ),
      "3m": mapSectionSpend(
        sectionBreakdown3m as { section: ExpenseSection; _sum: { originalAmount: { toString(): string } | null } }[],
      ),
    };

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
    const recentActivity = activityCandidates.slice(0, 20);

    return {
      ok: true,
      data: {
        totalCount,
        totalSpendUsd: totalSpendAgg._sum.originalAmount?.toString() ?? "0",
        monthSpendUsd: monthSpendAgg._sum.originalAmount?.toString() ?? "0",
        monthlySpendUsdLast6,
        previousMonthSpendUsd,
        byStatus,
        bySection,
        spendBySectionUsd,
        spendBySectionUsdByPeriod,
        recentExpenses: recentRows.map(serializeExpense),
        recentHistory,
        recentActivity,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Dashboard summary failed";
    return {
      ok: false,
      error: { code: "DASHBOARD_SUMMARY_FAILED", message },
    };
  }
}
