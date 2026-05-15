import type { ExpenseSection } from "@/generated/prisma/client";

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
