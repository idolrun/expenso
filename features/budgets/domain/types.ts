import type { Prisma } from "@/app/generated/prisma/client";

export type { SectionBudget } from "@/app/generated/prisma/client";
export { BudgetPeriod } from "@/app/generated/prisma/client";

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

/** Filter shape for listing section budgets. */
export type SectionBudgetListFilter = Pick<
  Prisma.SectionBudgetWhereInput,
  "section" | "isActive" | "period"
> & {
  periodOverlaps?: { start: Date; end: Date };
};
