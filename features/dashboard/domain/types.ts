import type { ExpenseSection, ExpenseStatus } from "@/generated/prisma/client";

import type { ExpenseDto, ExpenseHistoryWithExpenseDto } from "@/features/expenses/domain/dto";

export type DashboardActivityItemDto =
  | {
      kind: "expense_history";
      id: string;
      createdAt: string;
      expenseId: string;
      expenseTitle: string;
      section: ExpenseSection;
      batchId: string | null;
      fieldKey: string;
      oldValue: unknown;
      newValue: unknown;
      changedById: string;
      changedByLabel?: string;
    }
  | {
      kind: "audit_log";
      id: string;
      createdAt: string;
      action: string;
      entityType: string;
      entityId: string;
      actorId: string | null;
      actorLabel?: string | null;
      metadata?: unknown;
    };

export type DashboardMonthSpendUsd = {
  monthKey: string;
  label: string;
  amount: string;
};

export type DashboardSectionBreakdownPeriod = "1m" | "2m" | "3m";

export type SectionSpendDetail = {
  /** Total in USD (direct USD expenses). */
  usdTotal: string;
  /** Total in NPR (direct NPR expenses). */
  nprTotal: string;
  /** Sum of original USD amounts within this section. */
  originalUsdTotal: string;
  /** Sum of original NPR amounts within this section. */
  originalNprTotal: string;
  /** Average FX rate for USD→NPR conversions in this section (0 if none). */
  avgRate: string;
  /** Number of expenses in this section. */
  expenseCount: number;
};

export type DashboardSummaryDto = {
  totalCount: number;

  /** Sum of `originalAmount` for USD expenses only. */
  totalSpendUsd: string;
  /** Sum of `originalAmount` for USD expenses in the current calendar month. */
  monthSpendUsd: string;
  /** Oldest → newest: six UTC calendar months ending with the current month. */
  monthlySpendUsdLast6: DashboardMonthSpendUsd[];
  /** Prior UTC calendar month USD spend (month-over-month). */
  previousMonthSpendUsd: string;

  /**
   * Total NPR spend:
   *   NPR-denominated expenses (originalAmount where originalCurrency=NPR)
   *   + USD expenses converted via their stored FX snapshot (amountNpr where not null).
   */
  totalSpendNpr: string;
  /** Same NPR total for the current calendar month. */
  monthSpendNpr: string;

  byStatus: Partial<Record<ExpenseStatus, number>>;
  bySection: Partial<Record<ExpenseSection, number>>;

  /** USD spend per section. */
  spendBySectionUsd: Partial<Record<ExpenseSection, string>>;
  spendBySectionUsdByPeriod: Record<
    DashboardSectionBreakdownPeriod,
    Partial<Record<ExpenseSection, string>>
  >;

  /** NPR spend per section (direct NPR + USD→NPR via snapshot). */
  spendBySectionNpr: Partial<Record<ExpenseSection, string>>;

  /** Per-section currency breakdown for rich chart tooltips. */
  spendBySectionDetail: Partial<Record<ExpenseSection, SectionSpendDetail>>;

  recentExpenses: ExpenseDto[];
  recentHistory: ExpenseHistoryWithExpenseDto[];
  recentActivity: DashboardActivityItemDto[];
};
