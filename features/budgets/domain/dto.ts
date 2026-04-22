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

/** < 90 % → safe, 90–100 % → warning, > 100 % → danger */
export type BudgetThreshold = "safe" | "warning" | "danger";

/** Compute the threshold tier from a percentage value (0–∞). */
export function thresholdFromPercent(percent: number): BudgetThreshold {
  if (percent >= 100) return "danger";
  if (percent >= 90) return "warning";
  return "safe";
}

/**
 * Dashboard budget summary for one section — calculated against live expense spend.
 * All monetary amounts are in displayCurrency.
 * Snapshot values are pre-computed so the UI never needs a live FX call to render.
 */
export type SectionBudgetSummaryDto = {
  budget: SectionBudgetDto;
  /** The currency all monetary fields in this summary are expressed in. */
  displayCurrency: CurrencyCode;
  /** Total spend in the budget period in displayCurrency. Decimal string. */
  spentAmount: string;
  /** 0–∞ percentage consumed: (spent / budget) × 100, rounded to 2 dp. */
  spentPercent: number;
  /** Remaining budget (may be negative when over budget). Decimal string. */
  remainingAmount: string;
  isOverBudget: boolean;
  /** Threshold tier for visual indicators. */
  threshold: BudgetThreshold;
};
