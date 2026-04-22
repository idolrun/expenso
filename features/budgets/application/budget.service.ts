import { AuditAction, Prisma } from "@/app/generated/prisma/client";
import type { CurrencyCode, ExpenseSection } from "@/app/generated/prisma/client";

import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { PaginatedDto } from "@/features/expenses/domain/dto";
import { computeFxSnapshot } from "@/features/expenses/application/fx-snapshot.service";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { budgetRepository } from "@/features/budgets/infrastructure/budget.repository";
import {
  thresholdFromPercent,
  type SectionBudgetDto,
  type SectionBudgetSummaryDto,
} from "@/features/budgets/domain/dto";
import { serializeSectionBudget } from "@/features/budgets/domain/serialize";
import type {
  CreateSectionBudgetSchemaInput,
  ListSectionBudgetsQuery,
  UpdateSectionBudgetSchemaInput,
} from "@/features/budgets/validation/budget";
import { prisma } from "@/lib/prisma";

function parseYmdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export async function createSectionBudgetService(
  input: CreateSectionBudgetSchemaInput,
  actorUserId: string,
): Promise<ServiceResult<SectionBudgetDto>> {
  try {
    const budgetAmount = new Prisma.Decimal(input.budgetAmount);
    const fxSnapshot = await computeFxSnapshot(budgetAmount, input.budgetCurrency as CurrencyCode);

    const budget = await prisma.$transaction(async (tx) => {
      const created = await budgetRepository.create(tx, {
        section: input.section,
        period: input.period,
        budgetAmount,
        budgetCurrency: input.budgetCurrency as CurrencyCode,
        budgetAmountUsd: fxSnapshot?.amountUsd ?? undefined,
        budgetAmountNpr: fxSnapshot?.amountNpr ?? undefined,
        fxRateUsdNpr: fxSnapshot?.fxRateUsdNpr ?? undefined,
        fxRateSnapshotAt: fxSnapshot?.fxRateSnapshotAt ?? undefined,
        periodStart: parseYmdToUtcDate(input.periodStart),
        periodEnd: parseYmdToUtcDate(input.periodEnd),
        notes: input.notes ?? undefined,
        createdBy: actorUserId
          ? { connect: { id: actorUserId } }
          : undefined,
        updatedBy: actorUserId
          ? { connect: { id: actorUserId } }
          : undefined,
      });

      await auditLogRepository.create(tx, {
        action: AuditAction.SECTION_BUDGET_CREATED,
        entityType: "SectionBudget",
        entityId: created.id,
        actor: { connect: { id: actorUserId } },
        metadata: {
          section: created.section,
          period: created.period,
          budgetCurrency: created.budgetCurrency,
          fxSnapshotCaptured: fxSnapshot !== null,
        },
      });

      return created;
    });

    return { ok: true, data: serializeSectionBudget(budget) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Budget create failed";
    // Surface unique constraint violations explicitly.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message:
            "A budget for this section, period, and start date already exists",
        },
      };
    }
    return { ok: false, error: { code: "CREATE_FAILED", message } };
  }
}

export async function updateSectionBudgetService(
  input: UpdateSectionBudgetSchemaInput,
  actorUserId: string,
): Promise<ServiceResult<SectionBudgetDto>> {
  try {
    const existing = await budgetRepository.findById(prisma, input.id);
    if (!existing) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Budget not found" } };
    }

    const data: Prisma.SectionBudgetUpdateInput = {
      updatedBy: { connect: { id: actorUserId } },
    };

    const needsFxUpdate =
      input.budgetAmount !== undefined || input.budgetCurrency !== undefined;

    if (input.budgetAmount !== undefined) {
      data.budgetAmount = new Prisma.Decimal(input.budgetAmount);
    }
    if (input.budgetCurrency !== undefined) {
      data.budgetCurrency = input.budgetCurrency as CurrencyCode;
    }
    if (input.periodEnd !== undefined) {
      data.periodEnd = parseYmdToUtcDate(input.periodEnd);
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }
    if (input.notes !== undefined) {
      data.notes = input.notes;
    }

    if (needsFxUpdate) {
      const newAmount = input.budgetAmount
        ? new Prisma.Decimal(input.budgetAmount)
        : existing.budgetAmount;
      const newCurrency = (input.budgetCurrency ?? existing.budgetCurrency) as CurrencyCode;
      const fxSnapshot = await computeFxSnapshot(newAmount, newCurrency);
      if (fxSnapshot) {
        data.budgetAmountUsd = fxSnapshot.amountUsd;
        data.budgetAmountNpr = fxSnapshot.amountNpr;
        data.fxRateUsdNpr = fxSnapshot.fxRateUsdNpr;
        data.fxRateSnapshotAt = fxSnapshot.fxRateSnapshotAt;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await budgetRepository.update(tx, input.id, data);
      await auditLogRepository.create(tx, {
        action: AuditAction.SECTION_BUDGET_UPDATED,
        entityType: "SectionBudget",
        entityId: input.id,
        actor: { connect: { id: actorUserId } },
        metadata: { fxSnapshotRefreshed: needsFxUpdate },
      });
      return row;
    });

    return { ok: true, data: serializeSectionBudget(updated) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Budget update failed";
    return { ok: false, error: { code: "UPDATE_FAILED", message } };
  }
}

export async function getSectionBudgetService(
  id: string,
): Promise<ServiceResult<SectionBudgetDto>> {
  try {
    const row = await budgetRepository.findById(prisma, id);
    if (!row) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Budget not found" } };
    }
    return { ok: true, data: serializeSectionBudget(row) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Budget fetch failed";
    return { ok: false, error: { code: "FETCH_FAILED", message } };
  }
}

export async function listSectionBudgetsService(
  query: ListSectionBudgetsQuery,
): Promise<ServiceResult<PaginatedDto<SectionBudgetDto>>> {
  try {
    const where: Prisma.SectionBudgetWhereInput = {};
    if (query.section !== undefined) where.section = query.section;
    if (query.period !== undefined) where.period = query.period;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const skip = (query.page - 1) * query.pageSize;
    const [total, rows] = await Promise.all([
      budgetRepository.countWhere(prisma, where),
      budgetRepository.findMany(prisma, {
        where,
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      ok: true,
      data: {
        items: rows.map(serializeSectionBudget),
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "List failed";
    return { ok: false, error: { code: "LIST_FAILED", message } };
  }
}

/**
 * Resolve the monetary value of an expense in the target display currency.
 *
 * Priority:
 *   1. If originalCurrency matches target → use originalAmount (exact, no FX needed)
 *   2. Else if FX snapshot exists → use pre-computed amountUsd / amountNpr
 *   3. Else → null (expense not counted; caller should flag as incomplete)
 */
function expenseAmountInCurrency(
  expense: {
    originalAmount: Prisma.Decimal;
    originalCurrency: CurrencyCode;
    amountUsd: Prisma.Decimal | null;
    amountNpr: Prisma.Decimal | null;
  },
  displayCurrency: CurrencyCode,
): Prisma.Decimal | null {
  if (expense.originalCurrency === displayCurrency) {
    return expense.originalAmount;
  }
  return displayCurrency === "USD" ? expense.amountUsd : expense.amountNpr;
}

export async function getSectionBudgetSummaryService(
  section: ExpenseSection,
  displayCurrency: CurrencyCode,
  referenceDate: Date,
): Promise<ServiceResult<SectionBudgetSummaryDto>> {
  try {
    const budget = await budgetRepository.findActiveForSectionAt(
      prisma,
      section,
      referenceDate,
    );

    if (!budget) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: `No active budget found for section ${section} on ${referenceDate.toISOString().slice(0, 10)}`,
        },
      };
    }

    // Resolve the budget cap in displayCurrency.
    const budgetAmountInDisplay = expenseAmountInCurrency(
      {
        originalAmount: budget.budgetAmount,
        originalCurrency: budget.budgetCurrency,
        amountUsd: budget.budgetAmountUsd,
        amountNpr: budget.budgetAmountNpr,
      },
      displayCurrency,
    );

    if (!budgetAmountInDisplay) {
      return {
        ok: false,
        error: {
          code: "FX_SNAPSHOT_MISSING",
          message:
            "Budget FX snapshot not available for the requested display currency",
        },
      };
    }

    // Fetch all non-deleted expenses in the section within the budget window.
    const expenses = await prisma.expense.findMany({
      where: {
        section,
        deletedAt: null,
        incurredOn: {
          gte: budget.periodStart,
          lte: budget.periodEnd,
        },
      },
      select: {
        originalAmount: true,
        originalCurrency: true,
        amountUsd: true,
        amountNpr: true,
      },
    });

    // Sum amounts in displayCurrency, skipping rows with no snapshot yet.
    let spentDecimal = new Prisma.Decimal(0);
    for (const exp of expenses) {
      const contrib = expenseAmountInCurrency(
        {
          originalAmount: exp.originalAmount,
          originalCurrency: exp.originalCurrency,
          amountUsd: exp.amountUsd,
          amountNpr: exp.amountNpr,
        },
        displayCurrency,
      );
      if (contrib !== null) {
        spentDecimal = spentDecimal.add(contrib);
      }
    }

    const remaining = budgetAmountInDisplay.sub(spentDecimal);
    const percent =
      budgetAmountInDisplay.isZero()
        ? 0
        : spentDecimal
            .div(budgetAmountInDisplay)
            .mul(100)
            .toDecimalPlaces(2)
            .toNumber();

    return {
      ok: true,
      data: {
        budget: serializeSectionBudget(budget),
        displayCurrency,
        spentAmount: spentDecimal.toDecimalPlaces(4).toString(),
        spentPercent: percent,
        remainingAmount: remaining.toDecimalPlaces(4).toString(),
        isOverBudget: spentDecimal.greaterThan(budgetAmountInDisplay),
        threshold: thresholdFromPercent(percent),
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Budget summary failed";
    return { ok: false, error: { code: "SUMMARY_FAILED", message } };
  }
}

/**
 * Fetch budget summaries for all sections that have an active budget on the
 * reference date. Used by the dashboard service.
 */
export async function getAllActiveBudgetSummariesService(
  referenceDate: Date,
  displayCurrency: CurrencyCode,
): Promise<ServiceResult<SectionBudgetSummaryDto[]>> {
  try {
    const activeBudgets = await budgetRepository.findMany(prisma, {
      where: {
        isActive: true,
        periodStart: { lte: referenceDate },
        periodEnd: { gte: referenceDate },
      },
    });

    const summaries: SectionBudgetSummaryDto[] = [];

    for (const budget of activeBudgets) {
      const result = await getSectionBudgetSummaryService(
        budget.section,
        displayCurrency,
        referenceDate,
      );
      if (result.ok) summaries.push(result.data);
    }

    return { ok: true, data: summaries };
  } catch (e) {
    const message = e instanceof Error ? e.message : "All summaries failed";
    return { ok: false, error: { code: "SUMMARIES_FAILED", message } };
  }
}
