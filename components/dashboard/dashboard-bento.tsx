import Link from "next/link";

import type { DashboardSummaryDto } from "@/features/dashboard/domain/types";
import { badgeVariants } from "@/components/ui/badge-variants";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel, type ExpenseSectionId } from "@/src/lib/expense-sections";
import { cn } from "@/lib/utils";

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function DashboardBento({
  data,
  isAdmin,
}: {
  data: DashboardSummaryDto;
  isAdmin: boolean;
}) {
  const sectionEntries = Object.entries(data.spendBySectionUsd).filter(
    ([, v]) => Number(v) > 0,
  );
  const maxSection = Math.max(
    1,
    ...sectionEntries.map(([, v]) => Number(v)),
  );

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
          <CardContent>
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMoneyAmount(data.totalSpendUsd, "USD")}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {data.totalCount} active expense{data.totalCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This month</CardTitle>
            <CardDescription>Based on incurred date (UTC month).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMoneyAmount(data.monthSpendUsd, "USD")}
            </p>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Section breakdown</CardTitle>
            <CardDescription>Share of USD spend by area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectionEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No USD spend yet.</p>
            ) : (
              sectionEntries.map(([section, amount]) => {
                const n = Number(amount);
                const w = pct(n, maxSection);
                return (
                  <div key={section} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">
                        {sectionLabel(section as ExpenseSectionId)}
                      </span>
                      <span className="font-numeric text-muted-foreground shrink-0">
                        {formatMoneyAmount(amount, "USD")}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary/80 h-full rounded-full transition-[width] duration-300 ease-out"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status mix</CardTitle>
            <CardDescription>Active expenses by workflow state.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.keys(data.byStatus).length === 0 ? (
              <p className="text-muted-foreground text-sm">No data.</p>
            ) : (
              Object.entries(data.byStatus).map(([status, count]) => (
                <span
                  key={status}
                  className={cn(badgeVariants({ variant: "secondary" }), "font-mono text-xs")}
                >
                  {status}: {count}
                </span>
              ))
            )}
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
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/expenses/${e.id}`}
                        className="truncate font-medium text-sm underline-offset-4 hover:underline"
                      >
                        {e.title}
                      </Link>
                      <p className="text-muted-foreground truncate text-xs">
                        {sectionLabel(e.section)} · {e.status}
                      </p>
                    </div>
                    <span className="font-numeric text-sm font-medium tabular-nums">
                      {formatMoneyAmount(e.amount, e.currency)}
                    </span>
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
                  <li key={h.id} className="flex flex-col gap-0.5 rounded-md border bg-muted/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/expenses/${h.expenseId}`}
                        className="truncate font-medium underline-offset-4 hover:underline"
                      >
                        {h.expenseTitle}
                      </Link>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {h.fieldKey}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {sectionLabel(h.expenseSection)}
                    </span>
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
                                "text-[10px] uppercase",
                              )}
                            >
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
                            {item.fieldKey} · user {item.changedById.slice(0, 8)}…
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                badgeVariants({ variant: "secondary" }),
                                "text-[10px] uppercase",
                              )}
                            >
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
                              Actor {item.actorId.slice(0, 8)}…
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
