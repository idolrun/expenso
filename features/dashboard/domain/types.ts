import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

import type { ExpenseDto, ExpenseHistoryWithExpenseDto } from "@/features/expenses/domain/dto";

export type DashboardActivityItemDto =
  | {
      kind: "expense_history";
      id: string;
      createdAt: string;
      expenseId: string;
      expenseTitle: string;
      section: ExpenseSection;
      fieldKey: string;
      changedById: string;
    }
  | {
      kind: "audit_log";
      id: string;
      createdAt: string;
      action: string;
      entityType: string;
      entityId: string;
      actorId: string | null;
    };

/** One calendar month of USD spend (active expenses, `incurredOn` in range). */
export type DashboardMonthSpendUsd = {
  monthKey: string;
  label: string;
  amount: string;
};

/** Aggregated counts + spend + recents for dashboard (Phase 6). */
export type DashboardSummaryDto = {
  totalCount: number;
  /** Sum of `amount` for USD rows only (MVP single-currency rollup). */
  totalSpendUsd: string;
  /** Sum of `amount` for USD rows with `incurredOn` in the current calendar month. */
  monthSpendUsd: string;
  /** Oldest → newest: six UTC calendar months ending with the current month. */
  monthlySpendUsdLast6: DashboardMonthSpendUsd[];
  /** Prior UTC calendar month USD spend (for month-over-month on “This month”). */
  previousMonthSpendUsd: string;
  byStatus: Partial<Record<ExpenseStatus, number>>;
  bySection: Partial<Record<ExpenseSection, number>>;
  /** Decimal string totals per section (USD only). */
  spendBySectionUsd: Partial<Record<ExpenseSection, string>>;
  recentExpenses: ExpenseDto[];
  recentHistory: ExpenseHistoryWithExpenseDto[];
  recentActivity: DashboardActivityItemDto[];
};
