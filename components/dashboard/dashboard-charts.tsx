"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DashboardMonthSpendUsd,
  DashboardSectionBreakdownPeriod,
} from "@/features/dashboard/domain/types";
import type { SectionBudgetSummaryDto } from "@/features/budgets/domain/dto";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel, type ExpenseSectionId } from "@/src/lib/expense-sections";
import { cn } from "@/lib/utils";
import type { ExpenseSection, ExpenseStatus } from "@/app/generated/prisma/client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DASHBOARD_STATUS_CHART_COLORS,
  DASHBOARD_STATUS_CHART_ORDER,
  sectionChartColor,
} from "@/components/dashboard/dashboard-chart-palette";

const sparklineConfig = {
  amount: {
    label: "USD spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SectionBreakdownBarChart({
  spendBySectionUsd,
  periodLabel,
  displayCurrency = "USD",
}: {
  spendBySectionUsd: Partial<Record<ExpenseSectionId, string>>;
  periodLabel?: string;
  displayCurrency?: "USD" | "NPR";
}) {
  const captionId = React.useId();

  const rows = Object.entries(spendBySectionUsd)
    .filter(([, v]) => Number(v) > 0)
    .map(([section, amount]) => ({
      sectionKey: section as ExpenseSectionId,
      name: sectionLabel(section as ExpenseSectionId),
      amount: Number(amount),
    }))
    .sort((a, b) => b.amount - a.amount);

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {};
    for (const row of rows) {
      cfg[row.sectionKey] = {
        label: row.name,
        color: sectionChartColor(row.sectionKey as ExpenseSection),
      };
    }
    return cfg;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No {displayCurrency} spend yet.
      </p>
    );
  }

  return (
    <figure className="w-full" aria-labelledby={captionId}>
      <p id={captionId} className="sr-only">
        Column chart of {displayCurrency} spend by section. Data is repeated in the table below for screen readers.
      </p>
      <table className="sr-only">
        <caption>{displayCurrency} spend by section</caption>
        <thead>
          <tr>
            <th scope="col">Section</th>
            <th scope="col">Amount ({displayCurrency})</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sectionKey}>
              <td>{row.name}</td>
              <td>{formatMoneyAmount(String(row.amount), displayCurrency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {periodLabel ? <p className="sr-only">{periodLabel}</p> : null}
      <ChartContainer config={chartConfig} className="aspect-auto h-[min(22rem,calc(100vw-3rem))] w-full md:h-72">
        <BarChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <YAxis
            type="number"
            dataKey="amount"
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v) =>
              typeof v === "number"
                ? new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: displayCurrency,
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(v)
                : String(v)
            }
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatMoneyAmount(String(value), displayCurrency)
                }
                labelKey="name"
              />
            }
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {rows.map((row) => (
              <Cell key={row.sectionKey} fill={sectionChartColor(row.sectionKey as ExpenseSection)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

export const SECTION_BREAKDOWN_PERIOD_LABELS: Record<DashboardSectionBreakdownPeriod, string> = {
  "1m": "This month section breakdown",
  "2m": "Last two months section breakdown",
  "3m": "Last three months section breakdown",
};

function statusLabel(status: ExpenseStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function StatusMixDonutChart({
  byStatus,
  totalActiveCount,
}: {
  byStatus: Partial<Record<ExpenseStatus, number>>;
  totalActiveCount: number;
}) {
  const captionId = React.useId();

  const data = DASHBOARD_STATUS_CHART_ORDER.map((status) => ({
    status,
    name: statusLabel(status),
    value: byStatus[status] ?? 0,
    fill: DASHBOARD_STATUS_CHART_COLORS[status],
  })).filter((d) => d.value > 0);

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {};
    for (const row of data) {
      cfg[row.status] = {
        label: row.name,
        color: row.fill,
      };
    }
    return cfg;
  }, [data]);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No data.</p>;
  }

  return (
    <figure className="flex w-full flex-col items-center gap-3" aria-labelledby={captionId}>
      <p id={captionId} className="sr-only">
        Donut chart of active expenses by workflow status. Center shows total active expense count. Tabular data
        follows.
      </p>
      <table className="sr-only">
        <caption>Active expenses by status</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.status}>
              <td>{row.name}</td>
              <td>{row.value}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total active</th>
            <td>{totalActiveCount}</td>
          </tr>
        </tbody>
      </table>
      <div className="relative w-full max-w-[280px]">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[220px] w-full max-w-[280px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="status" hideIndicator />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius="58%"
              outerRadius="82%"
              stroke="var(--background)"
              strokeWidth={2}
            />
          </PieChart>
        </ChartContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          aria-hidden
        >
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">Total</span>
          <span className="font-numeric text-2xl font-semibold tabular-nums">{totalActiveCount}</span>
        </div>
      </div>
      <ul
        className="flex w-full flex-wrap items-center justify-center gap-2"
        aria-hidden
      >
        {data.map((row) => (
          <li key={row.status}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground",
                "dark:bg-muted/20",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full border border-border/40 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                style={{ backgroundColor: row.fill }}
              />
              <span>{row.name}</span>
              <span className="text-muted-foreground font-normal tabular-nums">{row.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function TotalSpendSparkline({ months }: { months: DashboardMonthSpendUsd[] }) {
  const data = months.map((m) => ({
    label: m.label,
    amount: Number(m.amount),
  }));

  const captionId = React.useId();

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 w-full" role="img" aria-labelledby={captionId}>
      <p id={captionId} className="sr-only">
        Sparkline of USD spending trend for the last six calendar months.
      </p>
      <table className="sr-only">
        <caption>Monthly USD spend (last six months)</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.monthKey}>
              <td>{m.label}</td>
              <td>{formatMoneyAmount(m.amount, "USD")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ChartContainer config={sparklineConfig} className="aspect-auto h-12 w-full">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillSpendSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, p) => (p?.[0]?.payload as { label?: string })?.label ?? ""}
                formatter={(value) => formatMoneyAmount(String(value), "USD")}
              />
            }
          />
          <Area
            dataKey="amount"
            type="monotone"
            fill="url(#fillSpendSpark)"
            stroke="var(--color-amount)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "var(--color-amount)" }}
          />
        </AreaChart>
      </ChartContainer>
      <p className="text-muted-foreground mt-1 text-[10px] leading-none">Last 6 months (USD, incurred)</p>
    </div>
  );
}

export function MonthOverMonthIndicator({
  monthSpendUsd,
  previousMonthSpendUsd,
}: {
  monthSpendUsd: string;
  previousMonthSpendUsd: string;
}) {
  const curr = Number(monthSpendUsd);
  const prev = Number(previousMonthSpendUsd);

  let text: string;
  let tone: "up" | "down" | "neutral";

  if (!Number.isFinite(curr) || !Number.isFinite(prev)) {
    return null;
  }

  if (prev === 0 && curr === 0) {
    text = "Same as last month";
    tone = "neutral";
  } else if (prev === 0) {
    text = "Up from $0.00 last month";
    tone = "up";
  } else {
    const pct = ((curr - prev) / prev) * 100;
    const rounded = Math.round(pct);
    const sign = rounded > 0 ? "+" : "";
    text = `${sign}${rounded}% from last month`;
    if (rounded > 0) tone = "up";
    else if (rounded < 0) tone = "down";
    else tone = "neutral";
  }

  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1.5 text-xs font-medium",
        tone === "up" && "text-emerald-500 dark:text-emerald-400",
        tone === "down" && "text-red-500 dark:text-red-400",
        tone === "neutral" && "text-muted-foreground",
      )}
    >
      <span aria-hidden className="font-numeric tabular-nums">
        {tone === "up" ? "↑" : tone === "down" ? "↓" : "→"}
      </span>
      <span>{text}</span>
    </p>
  );
}


export function BudgetBreakdownPieChart({
  summaries,
}: {
  summaries: SectionBudgetSummaryDto[];
}) {
  const captionId = React.useId();

  const data = React.useMemo(() => {
    return summaries
      .map((s) => {
        const budgetCap = Number(s.spentAmount) + Number(s.remainingAmount);
        return {
          id: s.budget.id,
          section: s.budget.section,
          name: sectionLabel(s.budget.section as ExpenseSectionId),
          value: budgetCap,
          fill: sectionChartColor(s.budget.section as ExpenseSection),
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [summaries]);

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {};
    for (const row of data) {
      cfg[row.section] = {
        label: row.name,
        color: row.fill,
      };
    }
    return cfg;
  }, [data]);

  const totalBudget = React.useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data],
  );

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No active budgets.</p>;
  }

  return (
    <figure className="flex w-full flex-col items-center gap-3" aria-labelledby={captionId}>
      <p id={captionId} className="sr-only">
        Straight-angle pie chart of active budget allocation by section.
        Tabular data follows.
      </p>
      <table className="sr-only">
        <caption>Budget allocation by section</caption>
        <thead>
          <tr>
            <th scope="col">Section</th>
            <th scope="col">Budget (USD)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{formatMoneyAmount(String(row.value), "USD")}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>{formatMoneyAmount(String(totalBudget), "USD")}</td>
          </tr>
        </tbody>
      </table>
      <div className="relative w-full max-w-[520px]">
        <ChartContainer config={chartConfig} className="mx-auto aspect-[2/1] h-[250px] w-full max-w-[420px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="section"
                  formatter={(value) => formatMoneyAmount(String(value), "USD")}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="section"
              startAngle={180}
              endAngle={0}
              innerRadius="0%"
              outerRadius="90%"
              stroke="var(--background)"
              strokeWidth={2}
            />
          </PieChart>
        </ChartContainer>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-1"
          aria-hidden
        >
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            Total budget
          </span>
          <span className="font-numeric text-lg font-semibold tabular-nums">
            {formatMoneyAmount(String(totalBudget), "USD")}
          </span>
        </div>
      </div>
      <ul className="flex w-full flex-wrap items-center justify-center gap-2" aria-hidden>
        {data.map((row) => (
          <li key={row.id}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground",
                "dark:bg-muted/20",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full border border-border/40 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                style={{ backgroundColor: row.fill }}
              />
              <span>{row.name}</span>
              <span className="text-muted-foreground font-normal tabular-nums">
                {formatMoneyAmount(String(row.value), "USD")}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
