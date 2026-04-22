"use client";

import { useState } from "react";
import Link from "next/link";

import type {
  DashboardSectionBreakdownPeriod,
  DashboardSummaryDto,
} from "@/features/dashboard/domain/types";
import { badgeVariants } from "@/components/ui/badge-variants";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencyToggle } from "@/components/ui/currency-toggle";
import { periodLabel } from "@/components/budgets/budget-progress-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel, type ExpenseSectionId } from "@/src/lib/expense-sections";
import { useDisplayCurrency } from "@/src/features/display-currency/display-currency-context";
import { cn } from "@/lib/utils";

import {
  SECTION_BREAKDOWN_PERIOD_LABELS,
  BudgetBreakdownPieChart,
  MonthOverMonthIndicator,
  SectionBreakdownBarChart,
  StatusMixDonutChart,
  TotalSpendSparkline,
} from "@/components/dashboard/dashboard-charts";

const ACTIVITY_BADGE_TONES: Record<string, string> = {
  EXPENSE_CREATED: "badge-tone-green",
  EXPENSE_UPDATED: "badge-tone-blue",
  EXPENSE_SOFT_DELETED: "badge-tone-red",
  EXPENSE_RESTORED: "badge-tone-green",
  TAG_ASSIGNED: "badge-tone-violet",
  TAG_REMOVED: "badge-tone-amber",
  USER_ROLE_CHANGED: "badge-tone-amber",
  CATEGORY_CREATED: "badge-tone-green",
  CATEGORY_UPDATED: "badge-tone-blue",
  CATEGORY_DELETED: "badge-tone-red",
  SECTION_BUDGET_CREATED: "badge-tone-green",
  SECTION_BUDGET_UPDATED: "badge-tone-blue",
  ATTACHMENT_ADDED: "badge-tone-violet",
  ATTACHMENT_REMOVED: "badge-tone-amber",
};

const FIELD_BADGE_TONES: Record<string, string> = {
  tagIds: "badge-tone-violet",
  status: "badge-tone-blue",
  originalAmount: "badge-tone-amber",
  title: "badge-tone-green",
};

export function DashboardBento({
  data,
  isAdmin,
}: {
  data: DashboardSummaryDto;
  isAdmin: boolean;
}) {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const lastThreeMonths = data.monthlySpendUsdLast6.slice(-3);
  const [sectionBreakdownPeriod, setSectionBreakdownPeriod] =
    useState<"all" | DashboardSectionBreakdownPeriod>("all");

  // Pick the right totals based on selected display currency
  const totalSpend =
    displayCurrency === "USD" ? data.totalSpendUsd : data.totalSpendNpr;
  const monthSpend =
    displayCurrency === "USD" ? data.monthSpendUsd : data.monthSpendNpr;
  const sectionSpend =
    displayCurrency === "NPR"
      ? data.spendBySectionNpr
      : sectionBreakdownPeriod === "all"
        ? data.spendBySectionUsd
        : data.spendBySectionUsdByPeriod[sectionBreakdownPeriod];

  const hasBudgets = data.sectionBudgetSummaries.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Spend and activity across your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mobile-only currency toggle (desktop is in the header) */}
          <CurrencyToggle
            value={displayCurrency}
            onChange={setDisplayCurrency}
            className="sm:hidden"
          />
          <Link
            href="/dashboard/expenses/new"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "shrink-0 gap-2",
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              +
            </span>
            New expense
          </Link>
        </div>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-6 lg:gap-5">
        {/* Total spend */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total spend ({displayCurrency})</CardTitle>
            <CardDescription>
              {displayCurrency === "USD"
                ? "Active USD-denominated expenses."
                : "NPR expenses + USD expenses converted via stored rate."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full min-h-52 flex-col">
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMoneyAmount(totalSpend, displayCurrency)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {data.totalCount} active expense{data.totalCount === 1 ? "" : "s"}
            </p>
            <div className="mt-auto pt-6">
              <TotalSpendSparkline months={data.monthlySpendUsdLast6} />
            </div>
          </CardContent>
        </Card>

        {/* This month */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This month ({displayCurrency})</CardTitle>
            <CardDescription>Based on incurred date (UTC month).</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full min-h-52 flex-col">
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMoneyAmount(monthSpend, displayCurrency)}
            </p>
            {displayCurrency === "USD" ? (
              <MonthOverMonthIndicator
                monthSpendUsd={data.monthSpendUsd}
                previousMonthSpendUsd={data.previousMonthSpendUsd}
              />
            ) : null}
            <div className="mt-auto space-y-2 border-t border-border/60 pt-5">
              <p className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
                Last 3 months (USD)
              </p>
              <div className="flex flex-col gap-2">
                {lastThreeMonths.map((month) => (
                  <div
                    key={month.monthKey}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2"
                  >
                    <p className="text-muted-foreground text-[10px] uppercase">
                      {month.label}
                    </p>
                    <p className="font-numeric text-xs font-medium">
                      {formatMoneyAmount(month.amount, "USD")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Shortcuts for common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/dashboard/expenses"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "w-full justify-between",
              )}
            >
              Browse expenses
              <span className="opacity-70" aria-hidden>
                →
              </span>
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard/admin/audit"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-between",
                )}
              >
                Audit log
                <span className="opacity-70" aria-hidden>
                  →
                </span>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        {/* Section breakdown */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base">Section breakdown</CardTitle>
              <CardDescription>
                {displayCurrency} spend by area
                {displayCurrency === "NPR" ? " (period filter uses USD data)" : ""}.
              </CardDescription>
            </div>
            {displayCurrency === "USD" ? (
              <div className="flex shrink-0 items-center rounded-md border border-border/70 bg-muted/20 p-1">
                {(["all", "1m", "2m", "3m"] as const).map((period) => (
                  <Button
                    key={period}
                    type="button"
                    size="sm"
                    variant={sectionBreakdownPeriod === period ? "secondary" : "ghost"}
                    className="h-7 px-2.5 text-[11px]"
                    onClick={() => setSectionBreakdownPeriod(period)}
                  >
                    {period === "all" ? "All" : period.toUpperCase()}
                  </Button>
                ))}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <SectionBreakdownBarChart
              spendBySectionUsd={sectionSpend}
              displayCurrency={displayCurrency}
              periodLabel={
                displayCurrency === "NPR"
                  ? "All-time NPR section breakdown"
                  : sectionBreakdownPeriod === "all"
                    ? "Overall section breakdown"
                    : SECTION_BREAKDOWN_PERIOD_LABELS[sectionBreakdownPeriod]
              }
            />
          </CardContent>
        </Card>

        {/* Status mix */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status mix</CardTitle>
            <CardDescription>Active expenses by workflow state.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusMixDonutChart
              byStatus={data.byStatus}
              totalActiveCount={data.totalCount}
            />
          </CardContent>
        </Card>

        {/* Budget breakdown */}
        {hasBudgets ? (
          <Card className="md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Budget breakdown</CardTitle>
              <CardDescription>
                Active budget allocation by section (USD).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetBreakdownPieChart summaries={data.sectionBudgetSummaries} />
            </CardContent>
          </Card>
        ) : null}

        {/* Budget summaries — grouped by section */}
        {hasBudgets ? (
          <div className="md:col-span-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold">
                Active budgets
              </h2>
              <p className="text-muted-foreground text-xs">
                Amounts in USD · today&apos;s period
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(
                data.sectionBudgetSummaries.reduce<
                  Record<string, typeof data.sectionBudgetSummaries>
                >((groups, s) => {
                  const key = s.budget.section;
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(s);
                  return groups;
                }, {}),
              ).map(([section, summaries]) => (
                <Card key={section}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {sectionLabel(section as ExpenseSectionId)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {summaries.map((summary) => {
                      const pct = Math.min(summary.spentPercent, 100);
                      const remaining = Number(summary.remainingAmount);
                      return (
                        <div key={summary.budget.id} className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {periodLabel(summary.budget.period)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatMoneyAmount(
                                  summary.budget.budgetAmount,
                                  summary.budget.budgetCurrency,
                                )}
                              </p>
                            </div>
                            <Badge
                              variant={
                                summary.threshold === "danger"
                                  ? "destructive"
                                  : summary.threshold === "warning"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="shrink-0"
                            >
                              {summary.spentPercent.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress
                            value={pct}
                            className={cn(
                              "h-2",
                              summary.threshold === "danger" &&
                                "[&>div]:bg-destructive",
                              summary.threshold === "warning" &&
                                "[&>div]:bg-amber-500",
                              summary.threshold === "safe" &&
                                "[&>div]:bg-emerald-500",
                            )}
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Spent:{" "}
                              <span className="font-medium text-foreground">
                                {formatMoneyAmount(
                                  summary.spentAmount,
                                  summary.displayCurrency,
                                )}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "tabular-nums",
                                summary.isOverBudget
                                  ? "font-medium text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              {summary.isOverBudget
                                ? `${formatMoneyAmount(
                                    Math.abs(remaining).toString(),
                                    summary.displayCurrency,
                                  )} over`
                                : `${formatMoneyAmount(
                                    summary.remainingAmount,
                                    summary.displayCurrency,
                                  )} left`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {/* Last transactions */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last transactions</CardTitle>
            <CardDescription>Five most recently updated expenses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {data.recentExpenses.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">No expenses yet.</p>
            ) : (
              <ul className="divide-y">
                {data.recentExpenses.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/dashboard/expenses/${e.id}`}
                      className="flex items-center justify-between gap-3 rounded-md py-2.5 transition-colors hover:bg-muted/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {sectionLabel(e.section)} · {e.status}
                        </p>
                      </div>
                      <span className="font-numeric text-sm font-medium tabular-nums">
                        {formatMoneyAmount(e.originalAmount, e.originalCurrency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Field updates */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Field updates</CardTitle>
            <CardDescription>Latest expense history entries.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentHistory.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">No history yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recentHistory.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/dashboard/expenses/${h.expenseId}`}
                      className="flex flex-col gap-0.5 rounded-md border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/45"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{h.expenseTitle}</span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {h.fieldKey}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {sectionLabel(h.expenseSection)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent activity feed */}
        <Card className="md:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>History and audit events (newest first).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="space-y-0">
                {data.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-sm">
                    No recent activity.
                  </p>
                ) : (
                  data.recentActivity.map((item, idx) => (
                    <div key={`${item.kind}-${item.id}-${idx}`}>
                      {idx > 0 ? (
                        <div role="separator" className="my-2 h-px w-full bg-border" />
                      ) : null}
                      {item.kind === "expense_history" ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                badgeVariants({ variant: "outline" }),
                                FIELD_BADGE_TONES[item.fieldKey] ?? "badge-tone-slate",
                                "activity-badge",
                                "text-[10px] uppercase",
                              )}
                            >
                              <span
                                aria-hidden
                                className="activity-badge-dot size-1.5 shrink-0 rounded-full opacity-100"
                              />
                              Field change
                            </span>
                            <time className="text-muted-foreground text-xs">
                              {new Date(item.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <Link
                            href={`/dashboard/expenses/${item.expenseId}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {item.expenseTitle}
                          </Link>
                          <p className="text-muted-foreground text-xs">
                            {item.fieldKey} ·{" "}
                            {item.changedByLabel ??
                              `user ${item.changedById.slice(0, 8)}…`}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                badgeVariants({ variant: "secondary" }),
                                ACTIVITY_BADGE_TONES[item.action] ?? "badge-tone-slate",
                                "activity-badge",
                                "text-[10px] uppercase",
                              )}
                            >
                              <span
                                aria-hidden
                                className="activity-badge-dot size-1.5 shrink-0 rounded-full opacity-100"
                              />
                              {item.action}
                            </span>
                            <time className="text-muted-foreground text-xs">
                              {new Date(item.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="font-medium">
                            {item.entityType}{" "}
                            <span className="text-muted-foreground font-normal">
                              #{item.entityId}
                            </span>
                          </p>
                          {item.actorId != null ? (
                            <p className="text-muted-foreground text-xs">
                              Actor{" "}
                              {item.actorLabel ?? item.actorId.slice(0, 8)}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
