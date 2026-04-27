"use client";

import { useState } from "react";
import Link from "next/link";

import type {
  DashboardActivityItemDto,
  DashboardSectionBreakdownPeriod,
  DashboardSummaryDto,
} from "@/features/dashboard/domain/types";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import { Badge } from "@/components/ui/badge";
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
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel } from "@/src/lib/expense-sections";
import { useDisplayCurrency } from "@/src/features/display-currency/display-currency-context";
import { cn } from "@/lib/utils";

import {
  SECTION_BREAKDOWN_PERIOD_LABELS,
  MonthOverMonthIndicator,
  SectionBreakdownBarChart,
  StatusMixDonutChart,
  TotalSpendSparkline,
} from "@/components/dashboard/dashboard-charts";
import { CredentialVaultWidget } from "@/components/credentials/credential-vault-widget";
import { FundVaultWidget } from "@/components/funds/fund-vault-widget";

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
  ATTACHMENT_ADDED: "badge-tone-violet",
  ATTACHMENT_REMOVED: "badge-tone-amber",
};

const FIELD_BADGE_TONES: Record<string, string> = {
  tagIds: "badge-tone-violet",
  status: "badge-tone-blue",
  originalAmount: "badge-tone-amber",
  title: "badge-tone-green",
};

const FIELD_LABELS: Record<string, string> = {
  categoryId: "Category",
  incurredOn: "Incurred date",
  notes: "Notes",
  originalAmount: "Amount",
  originalCurrency: "Currency",
  section: "Section",
  status: "Status",
  tagIds: "Tags",
  title: "Title",
};

const ACTIVITY_LABELS: Record<string, string> = {
  EXPENSE_CREATED: "Expense created",
  EXPENSE_UPDATED: "Expense updated",
  EXPENSE_SOFT_DELETED: "Expense deleted",
  EXPENSE_RESTORED: "Expense restored",
  FUNDENTRYCREATED: "Fund entry created",
};

type ExpenseHistoryActivity = Extract<
  DashboardActivityItemDto,
  { kind: "expense_history" }
>;

type AuditActivity = Extract<DashboardActivityItemDto, { kind: "audit_log" }>;

type ActivityThread = {
  key: string;
  latestAt: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  actorLabel?: string | null;
  expenseId?: string;
  expenseTitle?: string;
  changes: ExpenseHistoryActivity[];
  audit?: AuditActivity;
};

function fieldLabel(fieldKey: string): string {
  return FIELD_LABELS[fieldKey] ?? fieldKey;
}

function activityLabel(action: string): string {
  return (
    ACTIVITY_LABELS[action] ??
    action
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function formatActivityValue(value: unknown): string {
  if (value == null || value === "") return "empty";
  if (Array.isArray(value)) {
    return value.length === 0 ? "none" : value.map(formatActivityValue).join(", ");
  }
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "value";
    }
  }
  return String(value);
}

function getAuditBatchId(item: AuditActivity): string | null {
  if (
    item.metadata &&
    typeof item.metadata === "object" &&
    "batchId" in item.metadata
  ) {
    const batchId = (item.metadata as { batchId?: unknown }).batchId;
    return typeof batchId === "string" ? batchId : null;
  }
  return null;
}

function getAuditMetadata(
  item: AuditActivity | undefined,
): Record<string, unknown> | null {
  if (!item?.metadata || typeof item.metadata !== "object") return null;
  return item.metadata as Record<string, unknown>;
}

function formatFundSource(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function activityTitle(thread: ActivityThread): string {
  if (thread.expenseTitle) return thread.expenseTitle;

  if (thread.action === "FUNDENTRYCREATED") {
    const metadata = getAuditMetadata(thread.audit);
    const amount = metadata?.amount;
    const currency = metadata?.currency;
    const source = formatFundSource(metadata?.source);

    if (typeof amount === "string" && (currency === "USD" || currency === "NPR")) {
      return source
        ? `${formatMoneyAmount(amount, currency)} from ${source}`
        : formatMoneyAmount(amount, currency);
    }

    return source ? `Fund entry from ${source}` : "Fund entry";
  }

  return thread.entityType;
}

function buildActivityThreads(
  items: DashboardActivityItemDto[],
): ActivityThread[] {
  const threads: ActivityThread[] = [];
  const byBatchId = new Map<string, ActivityThread>();

  for (const item of items) {
    if (item.kind !== "audit_log") continue;
    const thread: ActivityThread = {
      key: `audit:${item.id}`,
      latestAt: item.createdAt,
      entityType: item.entityType,
      entityId: item.entityId,
      action: item.action,
      actorId: item.actorId,
      actorLabel: item.actorLabel,
      expenseId:
        item.entityType === "Expense" ? item.entityId : undefined,
      changes: [],
      audit: item,
    };
    threads.push(thread);

    const batchId = getAuditBatchId(item);
    if (batchId && item.entityType === "Expense") {
      byBatchId.set(batchId, thread);
    }
  }

  for (const item of items) {
    if (item.kind !== "expense_history") continue;

    const key = item.batchId ?? `history:${item.id}`;
    let thread = item.batchId ? byBatchId.get(item.batchId) : undefined;
    if (!thread) {
      thread = {
        key: `history:${key}`,
        latestAt: item.createdAt,
        entityType: "Expense",
        entityId: item.expenseId,
        action: "FIELD_CHANGE",
        actorId: item.changedById,
        actorLabel: item.changedByLabel,
        expenseId: item.expenseId,
        expenseTitle: item.expenseTitle,
        changes: [],
      };
      threads.push(thread);
      if (item.batchId) byBatchId.set(item.batchId, thread);
    }

    thread.expenseTitle ??= item.expenseTitle;
    thread.changes.push(item);
    if (new Date(item.createdAt) > new Date(thread.latestAt)) {
      thread.latestAt = item.createdAt;
    }
  }

  for (const thread of threads) {
    thread.changes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return threads.sort(
    (a, b) =>
      new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
  );
}

function resolveRecentExpenseAmount(
  expense: ExpenseDto,
  displayCurrency: "USD" | "NPR",
): { amount: string; currency: "USD" | "NPR"; isConverted: boolean } {
  if (expense.originalCurrency === displayCurrency) {
    return {
      amount: expense.originalAmount,
      currency: displayCurrency,
      isConverted: false,
    };
  }
  if (displayCurrency === "USD" && expense.amountUsd) {
    return { amount: expense.amountUsd, currency: "USD", isConverted: true };
  }
  if (displayCurrency === "NPR" && expense.amountNpr) {
    return { amount: expense.amountNpr, currency: "NPR", isConverted: true };
  }
  return {
    amount: expense.originalAmount,
    currency: expense.originalCurrency,
    isConverted: false,
  };
}

export function DashboardBento({
  data,
  isAdmin,
}: {
  data: DashboardSummaryDto;
  isAdmin: boolean;
}) {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const lastThreeMonths = data.monthlySpendUsdLast6.slice(-3);
  const [sectionBreakdownPeriod, setSectionBreakdownPeriod] = useState<
    "all" | DashboardSectionBreakdownPeriod
  >("all");

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
  const activityThreads = buildActivityThreads(data.recentActivity);

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
            <CardTitle className="text-base">
              Total spend ({displayCurrency})
            </CardTitle>
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
            <CardTitle className="text-base">
              This month ({displayCurrency})
            </CardTitle>
            <CardDescription>
              Based on incurred date (UTC month).
            </CardDescription>
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
            <Link
              href="/dashboard/funds"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-between",
              )}
            >
              Fund tracker
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
                {displayCurrency === "NPR"
                  ? " (period filter uses USD data)"
                  : ""}
                .
              </CardDescription>
            </div>
            {displayCurrency === "USD" ? (
              <div className="flex shrink-0 items-center rounded-md border border-border/70 bg-muted/20 p-1">
                {(["all", "1m", "2m", "3m"] as const).map((period) => (
                  <Button
                    key={period}
                    type="button"
                    size="sm"
                    variant={
                      sectionBreakdownPeriod === period ? "secondary" : "ghost"
                    }
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
            <CardDescription>
              Active expenses by workflow state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusMixDonutChart
              byStatus={data.byStatus}
              totalActiveCount={data.totalCount}
            />
          </CardContent>
        </Card>

        <FundVaultWidget className="md:col-span-3" />

        {/* Credential Vault */}
        <CredentialVaultWidget className="md:col-span-3" />

        {/* Last transactions */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last transactions</CardTitle>
            <CardDescription>
              Five most recently updated expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {data.recentExpenses.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">
                No expenses yet.
              </p>
            ) : (
              <ul className="divide-y">
                {data.recentExpenses.map((e) => {
                  const amount = resolveRecentExpenseAmount(e, displayCurrency);
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/dashboard/expenses/${e.id}`}
                        className="flex items-center justify-between gap-3 rounded-md py-2.5 transition-colors hover:bg-muted/20"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {e.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {sectionLabel(e.section)} · {e.status}
                          </p>
                        </div>
                        <span className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className="font-numeric text-sm font-medium tabular-nums">
                            {formatMoneyAmount(amount.amount, amount.currency)}
                          </span>
                          {amount.isConverted ? (
                            <Badge
                              variant="outline"
                              className="h-auto px-1.5 py-0 text-[9px] font-normal tabular-nums"
                            >
                              {formatMoneyAmount(
                                e.originalAmount,
                                e.originalCurrency,
                              )}
                            </Badge>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
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
              <p className="text-muted-foreground py-4 text-sm">
                No history yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recentHistory.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/dashboard/expenses/${h.expenseId}`}
                      className="flex flex-col gap-0.5 rounded-md border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/45"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {h.expenseTitle}
                        </span>
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
            <CardDescription>
              History and audit events (newest first).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="space-y-0">
                {activityThreads.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-sm">
                    No recent activity.
                  </p>
                ) : (
                  activityThreads.map((thread, idx) => {
                    const firstChange = thread.changes[0];
                    const actorLabel =
                      thread.actorLabel ??
                      firstChange?.changedByLabel ??
                      (thread.actorId ? thread.actorId.slice(0, 8) : null);
                    const badgeTone =
                      thread.action === "FIELD_CHANGE" && firstChange
                        ? FIELD_BADGE_TONES[firstChange.fieldKey]
                        : ACTIVITY_BADGE_TONES[thread.action];
                    const title = activityTitle(thread);
                    const href = thread.expenseId
                      ? `/dashboard/expenses/${thread.expenseId}`
                      : null;

                    return (
                      <div key={thread.key}>
                        {idx > 0 ? (
                          <div
                            role="separator"
                            className="my-3 h-px w-full bg-border"
                          />
                        ) : null}
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                badgeVariants({ variant: "secondary" }),
                                badgeTone ?? "badge-tone-slate",
                                "activity-badge",
                                "text-[10px] uppercase",
                              )}
                            >
                              <span
                                aria-hidden
                                className="activity-badge-dot size-1.5 shrink-0 rounded-full opacity-100"
                              />
                              {activityLabel(thread.action)}
                            </span>
                            <time className="text-muted-foreground text-xs">
                              {new Date(thread.latestAt).toLocaleString()}
                            </time>
                          </div>
                          {href ? (
                            <Link
                              href={href}
                              className="font-medium underline-offset-4 hover:underline"
                            >
                              {title}
                            </Link>
                          ) : (
                            <p className="font-medium">{title}</p>
                          )}
                          {actorLabel ? (
                            <p className="text-muted-foreground text-xs">
                              Changed by {actorLabel}
                            </p>
                          ) : null}
                          {thread.changes.length > 0 ? (
                            <ul className="mt-2 space-y-1.5">
                              {thread.changes.map((change) => (
                                <li
                                  key={change.id}
                                  className="rounded-md border bg-muted/25 px-3 py-2"
                                >
                                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {fieldLabel(change.fieldKey)}
                                    </span>
                                    <time className="text-muted-foreground text-[11px]">
                                      {new Date(
                                        change.createdAt,
                                      ).toLocaleString()}
                                    </time>
                                  </div>
                                  <div className="grid gap-1 text-xs sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                                    <span className="rounded bg-background/70 px-2 py-1 text-muted-foreground">
                                      {formatActivityValue(change.oldValue)}
                                    </span>
                                    <span className="hidden text-muted-foreground sm:inline">
                                      →
                                    </span>
                                    <span className="rounded bg-background px-2 py-1 font-medium">
                                      {formatActivityValue(change.newValue)}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
