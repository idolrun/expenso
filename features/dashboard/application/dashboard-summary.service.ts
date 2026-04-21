import { endOfMonth, startOfMonth } from "date-fns";

import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

import type { DashboardActivityItemDto, DashboardSummaryDto } from "@/features/dashboard/domain/types";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import { serializeExpense, serializeExpenseHistoryRow } from "@/features/expenses/domain/serialize";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { prisma } from "@/lib/prisma";

const activeUsdWhere = { deletedAt: null, currency: "USD" } as const;

export async function getDashboardSummary(): Promise<
  ServiceResult<DashboardSummaryDto>
> {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

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
    ] = await Promise.all([
      prisma.expense.count({ where: { deletedAt: null } }),
      prisma.expense.aggregate({
        where: activeUsdWhere,
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          ...activeUsdWhere,
          incurredOn: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
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
        _sum: { amount: true },
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
        },
      }),
      prisma.expenseHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          expense: { select: { id: true, title: true, section: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

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
      spendBySectionUsd[row.section] = row._sum.amount?.toString() ?? "0";
    }

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
      })),
      ...auditFeed.map((r) => ({
        kind: "audit_log" as const,
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        actorId: r.actorId,
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
        totalSpendUsd: totalSpendAgg._sum.amount?.toString() ?? "0",
        monthSpendUsd: monthSpendAgg._sum.amount?.toString() ?? "0",
        byStatus,
        bySection,
        spendBySectionUsd,
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
