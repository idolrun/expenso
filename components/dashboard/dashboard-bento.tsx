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
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel } from "@/src/lib/expense-sections";
import { cn } from "@/lib/utils";

import {
  SECTION_BREAKDOWN_PERIOD_LABELS,
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
  INVENTORY_ITEM_CREATED: "badge-tone-green",
  INVENTORY_ITEM_UPDATED: "badge-tone-blue",
  MERCHANDISE_ITEM_CREATED: "badge-tone-green",
  MERCHANDISE_ITEM_UPDATED: "badge-tone-blue",
  SALARY_RECORD_CREATED: "badge-tone-green",
  SALARY_RECORD_UPDATED: "badge-tone-blue",
};

const FIELD_BADGE_TONES: Record<string, string> = {
  tagIds: "badge-tone-violet",
  status: "badge-tone-blue",
  amount: "badge-tone-amber",
  title: "badge-tone-green",
};

export function DashboardBento({
  data,
  isAdmin,
}: {
  data: DashboardSummaryDto;
  isAdmin: boolean;
}) {
  const lastThreeMonths = data.monthlySpendUsdLast6.slice(-3);
  const [sectionBreakdownPeriod, setSectionBreakdownPeriod] =
    useState<"all" | DashboardSectionBreakdownPeriod>("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Spend and activity across your workspace.
          </p>
        </div>
        <Link
          href="/dashboard/expenses/new"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "shrink-0 gap-2 self-start sm:self-auto",
          )}
        >
          <span className="text-base leading-none" aria-hidden>
            +
          </span>
          New expense
        </Link>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-6 lg:gap-5">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total spend (USD)</CardTitle>
            <CardDescription>All active expenses, USD only.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full min-h-[13rem] flex-col">
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMoneyAmount(data.totalSpendUsd, "USD")}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {data.totalCount} active expense{data.totalCount === 1 ? "" : "s"}
            </p>
            <div className="mt-auto pt-6">
              <TotalSpendSparkline months={data.monthlySpendUsdLast6} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This month</CardTitle>
            <CardDescription>Based on incurred date (UTC month).</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full min-h-[13rem] flex-col">
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMoneyAmount(data.monthSpendUsd, "USD")}
            </p>
            <MonthOverMonthIndicator
              monthSpendUsd={data.monthSpendUsd}
              previousMonthSpendUsd={data.previousMonthSpendUsd}
            />
            <div className="mt-auto space-y-2 border-t border-border/60 pt-5">
              <p className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
                Last 3 months
              </p>
              <div className="flex flex-col gap-2">
                {lastThreeMonths.map((month) => (
                  <div
                    key={month.monthKey}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2"
                  >
                    <p className="text-muted-foreground text-[10px] uppercase">{month.label}</p>
                    <p className="font-numeric text-xs font-medium">
                      {formatMoneyAmount(month.amount, "USD")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base">Section breakdown</CardTitle>
              <CardDescription>Share of USD spend by area.</CardDescription>
            </div>
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
          </CardHeader>
          <CardContent>
            <SectionBreakdownBarChart
              spendBySectionUsd={
                sectionBreakdownPeriod === "all"
                  ? data.spendBySectionUsd
                  : data.spendBySectionUsdByPeriod[sectionBreakdownPeriod]
              }
              periodLabel={
                sectionBreakdownPeriod === "all"
                  ? "Overall section breakdown"
                  : SECTION_BREAKDOWN_PERIOD_LABELS[sectionBreakdownPeriod]
              }
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status mix</CardTitle>
            <CardDescription>Active expenses by workflow state.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusMixDonutChart byStatus={data.byStatus} totalActiveCount={data.totalCount} />
          </CardContent>
        </Card>

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
                        <p className="truncate font-medium text-sm">{e.title}</p>
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

        <Card className="md:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>History and audit events (newest first).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="space-y-0">
                {data.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-sm">No recent activity.</p>
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
                            {item.fieldKey} · {item.changedByLabel ?? `user ${item.changedById.slice(0, 8)}…`}
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
                            <span className="text-muted-foreground font-normal">#{item.entityId}</span>
                          </p>
                          {item.actorId != null ? (
                            <p className="text-muted-foreground text-xs">
                              Actor {item.actorLabel ?? item.actorId.slice(0, 8)}
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
