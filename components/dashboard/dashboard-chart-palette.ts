import type { ExpenseSection, ExpenseStatus } from "@/generated/prisma/client";

/** Muted, accessible fills for status distribution (dark-theme friendly). */
export const DASHBOARD_STATUS_CHART_COLORS: Record<ExpenseStatus, string> = {
  DRAFT: "hsl(220 12% 48%)",
  SUBMITTED: "hsl(217 55% 58%)",
  PAID: "hsl(265 45% 58%)",
  CANCELLED: "hsl(220 10% 42%)",
};

/** Display order for status segments and legend. */
export const DASHBOARD_STATUS_CHART_ORDER: ExpenseStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "PAID",
  "CANCELLED",
];

export function sectionChartColor(section: ExpenseSection): string {
  // Stable colors for section charts (high contrast on dark backgrounds)
  const colors: Record<ExpenseSection, string> = {
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
  return colors[section];
}
