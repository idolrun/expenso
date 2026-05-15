"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DashboardMonthSpendUsd,
  DashboardSectionBreakdownPeriod,
  SectionSpendDetail,
} from "@/features/dashboard/domain/types";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel, type ExpenseSectionId } from "@/src/lib/expense-sections";
import { cn } from "@/lib/utils";
import type { ExpenseSection } from "@/generated/prisma/client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  sectionChartColor,
} from "@/components/dashboard/dashboard-chart-palette";

const sparklineConfig = {
  amount: {
    label: "USD spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function SectionBreakdownTooltip({
  active,
  payload,
  label,
  displayCurrency,
  detail,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { sectionKey: ExpenseSectionId } }>;
  label?: string;
  displayCurrency: "USD" | "NPR";
  detail?: Partial<Record<ExpenseSectionId, SectionSpendDetail>>;
}) {
  if (!active || !payload?.length) return null;

  const p = payload[0];
  const sectionKey = p.payload.sectionKey;
  const d = detail?.[sectionKey];

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm">{label}</p>
      <p className="text-lg font-semibold tabular-nums">
        {formatMoneyAmount(String(p.value), displayCurrency)}
      </p>
      {d && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground border-t pt-2">
          {Number(d.originalUsdTotal) > 0 && (
            <p>Original USD: {formatMoneyAmount(d.originalUsdTotal, "USD")}</p>
          )}
          {Number(d.originalNprTotal) > 0 && (
            <p>Original NPR: {formatMoneyAmount(d.originalNprTotal, "NPR")}</p>
          )}
          {Number(d.avgRate) > 0 && (
            <p>Rate: 1 USD ≈ {d.avgRate} NPR</p>
          )}
          <p>{d.expenseCount} expense{d.expenseCount === 1 ? "" : "s"}</p>
        </div>
      )}
    </div>
  );
}

export function SectionBreakdownBarChart({
  spendBySectionUsd,
  periodLabel,
  displayCurrency = "USD",
  accessibleView = false,
  detail,
}: {
  spendBySectionUsd: Partial<Record<ExpenseSectionId, string>>;
  periodLabel?: string;
  displayCurrency?: "USD" | "NPR";
  accessibleView?: boolean;
  detail?: Partial<Record<ExpenseSectionId, SectionSpendDetail>>;
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

  if (accessibleView) {
    return (
      <div className="w-full">
        <p className="text-muted-foreground mb-2 text-xs font-medium">
          {displayCurrency} spend by section
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Section</th>
                <th className="px-3 py-2 text-right font-medium">Amount ({displayCurrency})</th>
                <th className="px-3 py-2 text-right font-medium">Expenses</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sectionKey} className="border-t">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 text-right font-numeric tabular-nums">
                    {formatMoneyAmount(String(row.amount), displayCurrency)}
                  </td>
                  <td className="px-3 py-2 text-right font-numeric tabular-nums">
                    {detail?.[row.sectionKey]?.expenseCount ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
              <SectionBreakdownTooltip
                displayCurrency={displayCurrency}
                detail={detail}
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

export function TotalSpendSparkline({
  months,
  accessibleView = false,
}: {
  months: DashboardMonthSpendUsd[];
  accessibleView?: boolean;
}) {
  const data = months.map((m) => ({
    label: m.label,
    amount: Number(m.amount),
  }));

  const captionId = React.useId();

  if (data.length === 0) {
    return null;
  }

  if (accessibleView) {
    return (
      <div className="mt-3 w-full">
        <p className="text-muted-foreground mb-2 text-xs font-medium">Monthly USD spend (last 6 months)</p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Month</th>
                <th className="px-3 py-2 text-right font-medium">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.monthKey} className="border-t">
                  <td className="px-3 py-2">{m.label}</td>
                  <td className="px-3 py-2 text-right font-numeric tabular-nums">
                    {formatMoneyAmount(m.amount, "USD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
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
