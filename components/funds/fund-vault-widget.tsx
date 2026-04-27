"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRightIcon } from "@phosphor-icons/react";

import { useFundSummary } from "@/src/features/funds/hooks/use-fund-summary";
import { formatMoneyAmount } from "@/src/lib/format-money";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FundSourceBadge } from "@/components/funds/fund-source-badge";

export function FundVaultWidget({ className }: { className?: string }) {
  const { summary, isLoading, error } = useFundSummary();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Fund Tracker</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && summary ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-medium tabular-nums">
              {summary.entryCount}
            </span>
          ) : null}
          <Link
            href="/dashboard/funds"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            All <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-10 w-1/2" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-4 text-center">
            Failed to load funds.
          </div>
        ) : summary ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Total NPR
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatMoneyAmount(summary.totalNPR, "NPR")}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Total USD
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatMoneyAmount(summary.totalUSD, "USD")}
                </p>
              </div>
            </div>

            {summary.latestFive.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No funds recorded yet. Add your first fund entry.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/50">
                {summary.latestFive.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex flex-col gap-1 items-start">
                      <FundSourceBadge source={entry.source} />
                      <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-xs">
                        {entry.sourceLabel || "Direct"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums">
                        {formatMoneyAmount(entry.amount, entry.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.receivedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
