"use client";

import { formatDistanceToNow } from "date-fns";

import { FundEntryRecord } from "@/features/funds/domain/types";
import { formatMoneyAmount } from "@/src/lib/format-money";

import { FundSourceBadge } from "@/components/funds/fund-source-badge";
import { Card, CardContent } from "@/components/ui/card";

export function FundEntryCard({ entry }: { entry: FundEntryRecord }) {
  return (
    <Card className="sm:hidden mb-4">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <FundSourceBadge source={entry.source} />
          <span className="text-lg font-bold tabular-nums">
            {formatMoneyAmount(entry.amount, entry.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {entry.sourceLabel || "Direct"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(entry.receivedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {entry.createdBy.name?.charAt(0).toUpperCase() ||
                entry.createdBy.email.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">
              {entry.createdBy.name || entry.createdBy.email.split("@")[0]}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(entry.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        {entry.note && (
          <p className="text-xs italic text-muted-foreground border-t pt-2 mt-1">
            {entry.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
