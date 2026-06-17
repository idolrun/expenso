"use client";

import { useMemo } from "react";
import { TrendUpIcon } from "@phosphor-icons/react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ExpenseSection } from "@/generated/prisma/client";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import { sectionChartColor } from "@/components/dashboard/dashboard-chart-palette";
import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { fetchExpenseList } from "@/src/features/expenses/api/expense-api.client";
import { useDisplayCurrency } from "@/src/features/display-currency/display-currency-context";
import { useAsyncQuery } from "@/src/lib/use-async-query";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel, type ExpenseSectionId } from "@/src/lib/labels";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Numeric value of an expense in the active display currency.
 * Mirrors `resolveDisplayAmount`: exact original → stored FX snapshot → original.
 */
function toDisplayNumber(expense: ExpenseDto, displayCurrency: "USD" | "NPR"): number {
  if (expense.originalCurrency === displayCurrency) {
    return Number(expense.originalAmount) || 0;
  }
  if (displayCurrency === "USD" && expense.amountUsd) return Number(expense.amountUsd) || 0;
  if (displayCurrency === "NPR" && expense.amountNpr) return Number(expense.amountNpr) || 0;
  return Number(expense.originalAmount) || 0;
}

/** Fetch every expense for `section` within `year`, paging through the API (pageSize cap is 100). */
async function fetchYearExpenses(
  section: ExpenseSectionId | undefined,
  year: number,
  signal: AbortSignal,
): Promise<ExpenseDto[]> {
  const all: ExpenseDto[] = [];
  let page = 1;
  // Section "OVERVIEW" intentionally lists every section (server ignores the filter).
  for (;;) {
    const query = listExpensesQuerySchema.parse({
      ...(section ? { section } : {}),
      dateRangeStart: `${year}-01-01`,
      dateRangeEnd: `${year}-12-31`,
      pageSize: 100,
      page,
      sortField: "fromDate",
      sortDir: "asc",
    });
    const res = await fetchExpenseList(query, signal);
    all.push(...res.items);
    if (res.items.length === 0 || all.length >= res.total || page >= 50) break;
    page += 1;
  }
  return all;
}

/**
 * Vertical bars sized relative to the largest value, tinted with the section's chart
 * color. Each bar carries a tooltip showing its label and the amount spent. Bars opt back
 * into pointer events so they can be hovered through the otherwise pass-through overlay.
 */
function MiniBars({
  values,
  labels,
  displayCurrency,
  color,
}: {
  values: number[];
  labels: string[];
  displayCurrency: "USD" | "NPR";
  color: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full items-end gap-[3px]">
        {values.map((v, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                aria-label={`${labels[i]}: ${formatMoneyAmount(v.toString(), displayCurrency)}`}
                className="pointer-events-auto flex-1 rounded-sm opacity-80 transition-[height,opacity] duration-300 hover:opacity-100"
                style={{
                  height: `${v > 0 ? Math.max(4, (v / max) * 100) : 1.5}%`,
                  backgroundColor: color,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} collisionPadding={8}>
              <span className="font-medium">{labels[i]}</span>
              <span className="tabular-nums">
                {formatMoneyAmount(v.toString(), displayCurrency)}
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

type SummaryStat = {
  monthTotal: number;
  yearTotal: number;
  topTitle: string | null;
  topTitleTotal: number;
  monthly: number[];
  daily: number[];
  dailyLabels: string[];
};

function computeStats(
  items: ExpenseDto[],
  displayCurrency: "USD" | "NPR",
  now: Date,
): SummaryStat {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthly = new Array(12).fill(0) as number[];
  const daily = new Array(daysInMonth).fill(0) as number[];
  const byTitle = new Map<string, number>();

  let monthTotal = 0;
  let yearTotal = 0;

  for (const e of items) {
    // fromDate is an ISO date (YYYY-MM-DD); parse parts directly to avoid TZ drift.
    const [y, m, d] = e.fromDate.split("-").map(Number);
    if (y !== year) continue;
    const value = toDisplayNumber(e, displayCurrency);
    yearTotal += value;
    monthly[m - 1] += value;
    byTitle.set(e.title, (byTitle.get(e.title) ?? 0) + value);
    if (m - 1 === month) {
      monthTotal += value;
      daily[d - 1] += value;
    }
  }

  let topTitle: string | null = null;
  let topTitleTotal = 0;
  for (const [title, total] of byTitle) {
    if (total > topTitleTotal) {
      topTitle = title;
      topTitleTotal = total;
    }
  }

  return {
    monthTotal,
    yearTotal,
    topTitle,
    topTitleTotal,
    monthly,
    daily,
    dailyLabels: daily.map((_, i) => `${MONTH_LABELS[month]} ${i + 1}`),
  };
}

/**
 * Bento summary for the expenses list: this month's spend, this year's spend, and the
 * title spent on most. Hovering the month / year cards dims their text and reveals a
 * bar chart of the spend distribution, tinted with the section's dashboard chart color.
 */
export function SectionSpendSummary({
  section,
}: {
  section?: ExpenseSectionId;
}) {
  const { displayCurrency } = useDisplayCurrency();
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();

  const effectiveSection =
    section && section !== "OVERVIEW" ? section : undefined;

  const { data, isLoading } = useAsyncQuery<ExpenseDto[]>(
    (signal) => fetchYearExpenses(effectiveSection, year, signal),
    `section-spend-summary:${effectiveSection ?? "ALL"}:${year}`,
  );

  const stats = useMemo(
    () => computeStats(data ?? [], displayCurrency, now),
    [data, displayCurrency, now],
  );

  const scopeLabel = section ? sectionLabel(section) : "All expenses";
  // Match the dashboard "spend by section" palette so a section is the same color everywhere.
  const accentColor = sectionChartColor((section ?? "OVERVIEW") as ExpenseSection);

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Skeleton className="h-36 lg:col-span-2" />
        <Skeleton className="h-36 lg:col-span-2" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {/* This month — hover reveals daily spend */}
      <article className="group bg-card relative min-h-36 rounded-xl border p-5 lg:col-span-2">
        <div className="pointer-events-none relative z-10 transition-opacity duration-300 group-hover:opacity-15">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {MONTH_LABELS[now.getMonth()]} {year} · {scopeLabel}
          </p>
          <p className="font-numeric mt-2 text-2xl font-semibold tabular-nums md:text-3xl">
            {formatMoneyAmount(stats.monthTotal.toString(), displayCurrency)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Spent this month</p>
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-end gap-2 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span
            className="text-xs font-medium"
            style={{ color: accentColor }}
          >
            Daily spend
          </span>
          <div className="h-24">
            <MiniBars
              values={stats.daily}
              labels={stats.dailyLabels}
              displayCurrency={displayCurrency}
              color={accentColor}
            />
          </div>
        </div>
      </article>

      {/* This year — hover reveals monthly spend */}
      <article className="group bg-card relative min-h-36 rounded-xl border p-5 lg:col-span-2">
        <div className="pointer-events-none relative z-10 transition-opacity duration-300 group-hover:opacity-15">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {year} · {scopeLabel}
          </p>
          <p className="font-numeric mt-2 text-2xl font-semibold tabular-nums md:text-3xl">
            {formatMoneyAmount(stats.yearTotal.toString(), displayCurrency)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Spent this year</p>
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-end gap-2 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span
            className="text-xs font-medium"
            style={{ color: accentColor }}
          >
            Monthly spend
          </span>
          <div className="h-24">
            <MiniBars
              values={stats.monthly}
              labels={MONTH_LABELS}
              displayCurrency={displayCurrency}
              color={accentColor}
            />
          </div>
        </div>
      </article>

      {/* Most spent on — no hover graph */}
      <article className="bg-card relative flex min-h-36 flex-col justify-between overflow-hidden rounded-xl border p-5">
        <div className="flex items-center gap-1.5">
          <TrendUpIcon className="size-4" weight="bold" style={{ color: accentColor }} />
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Most spent on
          </p>
        </div>
        {stats.topTitle ? (
          <div>
            <p className="truncate text-lg font-semibold" title={stats.topTitle}>
              {stats.topTitle}
            </p>
            <p className="font-numeric text-muted-foreground mt-1 text-sm tabular-nums">
              {formatMoneyAmount(stats.topTitleTotal.toString(), displayCurrency)}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No expenses yet</p>
        )}
      </article>
    </div>
  );
}
