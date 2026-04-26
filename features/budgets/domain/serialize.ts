import type { SectionBudget } from "@/generated/prisma/client";

import type { SectionBudgetDto } from "@/features/budgets/domain/dto";

export function serializeSectionBudget(row: SectionBudget): SectionBudgetDto {
  return {
    id: row.id,
    section: row.section,
    period: row.period,
    budgetAmount: row.budgetAmount.toString(),
    budgetCurrency: row.budgetCurrency,
    budgetAmountUsd: row.budgetAmountUsd?.toString() ?? null,
    budgetAmountNpr: row.budgetAmountNpr?.toString() ?? null,
    fxRateUsdNpr: row.fxRateUsdNpr?.toString() ?? null,
    fxRateSnapshotAt: row.fxRateSnapshotAt?.toISOString() ?? null,
    periodStart: row.periodStart.toISOString().slice(0, 10),
    periodEnd: row.periodEnd.toISOString().slice(0, 10),
    isActive: row.isActive,
    notes: row.notes ?? null,
    createdById: row.createdById ?? null,
    updatedById: row.updatedById ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
