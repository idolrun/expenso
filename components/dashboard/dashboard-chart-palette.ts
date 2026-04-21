import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

/**
 * Stable colors for section charts (high contrast on dark backgrounds).
 * Use the same mapping anywhere a section appears in a visualization.
 */
export const DASHBOARD_SECTION_CHART_COLORS: Record<ExpenseSection, string> = {
  OVERVIEW: "hsl(210 70% 58%)",
  TECH: "hsl(188 86% 48%)",
  MARKETING: "hsl(280 65% 60%)",
  SOCIAL_MEDIA: "hsl(330 70% 62%)",
  PETTY_CASH: "hsl(45 90% 52%)",
  SALARY: "hsl(152 55% 48%)",
  TRAVEL: "hsl(262 70% 62%)",
  INVENTORY: "hsl(24 85% 55%)",
  MERCHANDISE: "hsl(200 75% 55%)",
};

/** Muted, accessible fills for status distribution (dark-theme friendly). */
export const DASHBOARD_STATUS_CHART_COLORS: Record<ExpenseStatus, string> = {
  DRAFT: "hsl(220 12% 48%)",
  SUBMITTED: "hsl(217 55% 58%)",
  APPROVED: "hsl(152 40% 48%)",
  REJECTED: "hsl(0 45% 55%)",
  PAID: "hsl(265 45% 58%)",
  CANCELLED: "hsl(220 10% 42%)",
};

/** Display order for status segments and legend. */
export const DASHBOARD_STATUS_CHART_ORDER: ExpenseStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
];

export function sectionChartColor(section: ExpenseSection): string {
  return DASHBOARD_SECTION_CHART_COLORS[section];
}

export function statusChartColor(status: ExpenseStatus): string {
  return DASHBOARD_STATUS_CHART_COLORS[status];
}
