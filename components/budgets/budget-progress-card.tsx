"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SectionBudgetSummaryDto } from "@/features/budgets/domain/dto";
import { cn } from "@/lib/utils";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel } from "@/src/lib/expense-sections";
import type { ExpenseSection } from "@/app/generated/prisma/client";

function periodLabel(period: string): string {
  switch (period) {
    case "MONTHLY": return "Monthly";
    case "QUARTERLY": return "Quarterly";
    case "SEMI_ANNUAL": return "Semi-annual";
    case "ANNUAL": return "Annual";
    default: return period.toLowerCase();
  }
}

function thresholdBadgeVariant(threshold: SectionBudgetSummaryDto["threshold"]) {
  if (threshold === "danger") return "destructive";
  if (threshold === "warning") return "secondary";
  return "outline";
}

export function BudgetProgressCard({
  summary,
  className,
}: {
  summary: SectionBudgetSummaryDto;
  className?: string;
}) {
  const pct = Math.min(summary.spentPercent, 100);
  const remaining = Number(summary.remainingAmount);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">
              {sectionLabel(summary.budget.section as ExpenseSection)}
            </CardTitle>
            <CardDescription>
              {formatMoneyAmount(summary.budget.budgetAmount, summary.budget.budgetCurrency)}{" "}
              · {periodLabel(summary.budget.period)}
            </CardDescription>
          </div>
          <Badge
            variant={thresholdBadgeVariant(summary.threshold)}
            className="shrink-0"
          >
            {summary.spentPercent.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={pct}
          className={cn(
            "h-2",
            summary.threshold === "danger" && "[&>div]:bg-destructive",
            summary.threshold === "warning" && "[&>div]:bg-amber-500",
            summary.threshold === "safe" && "[&>div]:bg-emerald-500",
          )}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Spent:{" "}
            <span className="font-medium text-foreground">
              {formatMoneyAmount(summary.spentAmount, summary.displayCurrency)}
            </span>
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              summary.isOverBudget
                ? "font-medium text-destructive"
                : "text-muted-foreground",
            )}
          >
            {summary.isOverBudget
              ? `${formatMoneyAmount(Math.abs(remaining).toString(), summary.displayCurrency)} over`
              : `${formatMoneyAmount(summary.remainingAmount, summary.displayCurrency)} left`}
          </span>
        </div>
        {summary.isOverBudget ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">
              This section has exceeded its budget for the period.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
