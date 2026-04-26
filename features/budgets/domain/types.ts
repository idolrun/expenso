export type { BudgetPeriod } from "@/generated/prisma/client";

export const budgetPeriodValues = [
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
] as const;

/** All supported budget periods with human-readable labels. */
export const budgetPeriodLabels: Record<(typeof budgetPeriodValues)[number], string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly (3 months)",
  SEMI_ANNUAL: "Semi-Annual (6 months)",
  ANNUAL: "Annual",
};

/** Segmented toggle options for the budget period selector. */
export const budgetPeriodToggles: { label: string; value: (typeof budgetPeriodValues)[number] }[] = [
  { label: "1M", value: "MONTHLY" },
  { label: "3M", value: "QUARTERLY" },
  { label: "6M", value: "SEMI_ANNUAL" },
  { label: "1Y", value: "ANNUAL" },
];
