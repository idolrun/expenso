import type { BudgetPeriod, CurrencyCode, ExpenseSection } from "@/app/generated/prisma/client";

/** Serializable budget row for API responses and dashboard display. */
export type SectionBudgetDto = {
  id: string;
  section: ExpenseSection;
  period: BudgetPeriod;

  /** Budget amount in the currency it was originally entered. Decimal string. */
  budgetAmount: string;
  /** The currency the budget was entered in. */
  budgetCurrency: CurrencyCode;

  /** USD equivalent captured at time of budget creation. Null if not yet snapshotted. */
  budgetAmountUsd: string | null;
  /** NPR equivalent captured at time of budget creation. Null if not yet snapshotted. */
  budgetAmountNpr: string | null;
  /** 1 USD = fxRateUsdNpr NPR at snapshot time. Null if not yet captured. */
  fxRateUsdNpr: string | null;
  /** ISO-8601 datetime when the FX snapshot was taken. Null if not yet captured. */
  fxRateSnapshotAt: string | null;

  /** ISO date (YYYY-MM-DD) — inclusive window start. */
  periodStart: string;
  /** ISO date (YYYY-MM-DD) — inclusive window end. */
  periodEnd: string;

  isActive: boolean;
  notes: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Input for creating a new section budget. */
export type CreateSectionBudgetInput = {
  section: ExpenseSection;
  period: BudgetPeriod;
  budgetCurrency: CurrencyCode;
  /** Positive decimal string, e.g. "5000.00". */
  budgetAmount: string;
  /** YYYY-MM-DD — inclusive start of the budget window. */
  periodStart: string;
  /** YYYY-MM-DD — inclusive end of the budget window. */
  periodEnd: string;
  notes?: string | null;
};

/** Input for updating an existing section budget. All fields optional except id. */
export type UpdateSectionBudgetInput = {
  id: string;
  budgetCurrency?: CurrencyCode;
  budgetAmount?: string;
  periodEnd?: string;
  isActive?: boolean;
  notes?: string | null;
};

/**
 * Dashboard budget summary for one section — calculated against live expense spend.
 * Carry comparison values from snapshots so the UI never needs to call the
 * exchange-rate API to render budget progress bars.
 */
export type SectionBudgetSummaryDto = {
  budget: SectionBudgetDto;
  /** Total spend in the budget period, denominated in budgetCurrency (USD only for Phase 1). */
  spentAmount: string;
  /** Percentage consumed: (spentAmount / budgetAmount) * 100, clamped to 0–999. */
  spentPercent: number;
  /** Remaining amount (may be negative if over budget). Decimal string. */
  remainingAmount: string;
  isOverBudget: boolean;
};
