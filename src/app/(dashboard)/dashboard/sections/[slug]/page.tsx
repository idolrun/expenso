import { notFound } from "next/navigation";

import { UserRole } from "@/generated/prisma/client";
import { ExpenseListClient } from "@/components/expenses/expense-list-client";
import { BudgetCreateSheet } from "@/components/budgets/budget-create-sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { formatMoneyAmount } from "@/src/lib/format-money";
import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { getSectionBudgetSummariesForSection } from "@/features/budgets/application/budget.service";
import { requireAuth } from "@/lib/auth/guards";
import { parseUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { flattenSearchParams } from "@/src/lib/flatten-search-params";
import { sectionFromSlug, sectionLabel } from "@/src/lib/expense-sections";
import { budgetPeriodToggles } from "@/features/budgets/domain/types";
import type { BudgetPeriod } from "@/features/budgets/domain/types";

export default async function SectionExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  const { slug } = await params;
  const section = sectionFromSlug(slug);
  if (!section) notFound();

  const sp = flattenSearchParams(await searchParams);
  const parsed = listExpensesQuerySchema.safeParse({ ...sp, section });

  const [tags, summariesResult] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    getSectionBudgetSummariesForSection(section, "USD"),
  ]);

  const summaries = summariesResult.ok ? summariesResult.data : [];
  const summaryByPeriod = new Map<BudgetPeriod, (typeof summaries)[number]>();
  for (const s of summaries) {
    summaryByPeriod.set(s.budget.period as BudgetPeriod, s);
  }

  const canWrite = role === UserRole.ADMIN || role === UserRole.USER;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {sectionLabel(section)}
          </h1>
          <p className="text-muted-foreground text-sm">
            Expenses and budget for this business area.
          </p>
        </div>
        {canWrite ? (
          <Button asChild size="sm" className="shrink-0 self-start">
            <Link href={`/dashboard/expenses/new?section=${section}`}>
              Create expense
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Period budgets — compact bento grid */}
      <div className="space-y-3">
        <h2 className="font-heading text-base font-semibold">Period budgets</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {budgetPeriodToggles.map((toggle) => {
            const summary = summaryByPeriod.get(toggle.value);
            return (
              <div
                key={toggle.value}
                className={
                  summary
                    ? "relative rounded-xl border bg-card p-4 shadow-xs"
                    : "relative rounded-xl border border-dashed bg-muted/20 p-4"
                }
              >
                {summary ? (
                  <>
                    {/* Active budget cell */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {toggle.label}
                      </Badge>
                      {canWrite ? (
                        <BudgetCreateSheet
                          defaultSection={section}
                          existingBudget={summary.budget}
                        >
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
                            aria-label={`Edit ${toggle.label} budget`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="size-3.5"><path d="M227.31 73.37 182.63 28.68a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63ZM48 208v-28.7L76.69 208Zm60.7-16L48 127.31l24-24L132.69 188Z"/></svg>
                          </button>
                        </BudgetCreateSheet>
                      ) : null}
                    </div>
                    <p className="font-numeric text-lg font-semibold tracking-tight">
                      {formatMoneyAmount(
                        summary.budget.budgetAmount,
                        summary.budget.budgetCurrency,
                      )}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      <Progress
                        value={Math.min(summary.spentPercent, 100)}
                        className={
                          summary.threshold === "danger"
                            ? "h-1.5 [&>div]:bg-destructive"
                            : summary.threshold === "warning"
                              ? "h-1.5 [&>div]:bg-amber-500"
                              : "h-1.5 [&>div]:bg-emerald-500"
                        }
                      />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          {summary.spentPercent.toFixed(0)}% used
                        </span>
                        <span
                          className={
                            summary.isOverBudget
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {summary.isOverBudget
                            ? `${formatMoneyAmount(
                                Math.abs(Number(summary.remainingAmount)).toString(),
                                summary.displayCurrency,
                              )} over`
                            : `${formatMoneyAmount(
                                summary.remainingAmount,
                                summary.displayCurrency,
                              )} left`}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Empty budget cell */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {toggle.label}
                      </Badge>
                      {canWrite ? (
                        <BudgetCreateSheet
                          defaultSection={section}
                          defaultPeriod={toggle.value}
                        >
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
                            aria-label={`Set ${toggle.label} budget`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="size-3.5"><path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8Z"/></svg>
                          </button>
                        </BudgetCreateSheet>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-sm">Not set</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ExpenseListClient
        tags={tags}
        section={section}
        initialQuery={parsed.success ? parsed.data : { section }}
        title="Expenses"
        description="Filtered to this section. You can still adjust other filters."
      />
    </div>
  );
}
