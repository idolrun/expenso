"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, FunnelIcon, TrashIcon } from "@phosphor-icons/react";

import { useFundList } from "@/src/features/funds/hooks/use-fund-list";
import {
  FundEntryRecord,
  FundSource,
  CurrencyCode,
} from "@/features/funds/domain/types";
import { formatMoneyAmount } from "@/src/lib/format-money";

import { FundSourceBadge } from "@/components/funds/fund-source-badge";
import { FundEntryCard } from "@/components/funds/fund-entry-card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FundListClientProps {
  initialData: { entries: FundEntryRecord[]; total: number };
}

const SOURCE_OPTIONS: Record<string, string> = {
  ALL: "All Sources",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  CASH: "Cash",
  CLIENT_PAYMENT: "Client Payment",
  LOAN: "Loan",
  INVESTMENT: "Investment",
  GRANT: "Grant",
  OTHER: "Other",
};

export function FundListClient({ initialData }: FundListClientProps) {
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [createdById, setCreatedById] = useState<string>("ALL");
  const [source, setSource] = useState<string>("ALL");
  const [currency, setCurrency] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [fromMonth, setFromMonth] = useState<number>(new Date().getMonth());
  const [fromYear, setFromYear] = useState<number>(new Date().getFullYear());
  const [toMonth, setToMonth] = useState<number>(new Date().getMonth());
  const [toYear, setToYear] = useState<number>(new Date().getFullYear());

  // Extract unique users for filtering
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map();
    initialData.entries.forEach((e) => {
      if (!usersMap.has(e.createdById)) {
        usersMap.set(e.createdById, {
          id: e.createdBy.id,
          name: e.createdBy.name || e.createdBy.email,
        });
      }
    });
    return Array.from(usersMap.values());
  }, [initialData]);

  // Construct filters
  const filters: Record<string, unknown> = {};
  if (amountMin) filters.amountMin = parseFloat(amountMin);
  if (amountMax) filters.amountMax = parseFloat(amountMax);
  if (createdById !== "ALL") filters.createdById = createdById;
  if (source !== "ALL") filters.source = source as FundSource;
  if (currency !== "ALL") filters.currency = currency as CurrencyCode;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const { entries, total, isValidating } = useFundList(filters);

  // Use initial data as fallback if current hook data hasn't loaded yet
  // SWR automatically handles keepPreviousData, but initial server render uses initialData
  const displayData = {
    entries: entries.length > 0 ? entries : initialData.entries,
    total: total > 0 ? total : initialData.total,
  };

  const clearFilters = () => {
    setAmountMin("");
    setAmountMax("");
    setCreatedById("ALL");
    setSource("ALL");
    setCurrency("ALL");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters =
    amountMin ||
    amountMax ||
    createdById !== "ALL" ||
    source !== "ALL" ||
    currency !== "ALL" ||
    dateFrom ||
    dateTo;

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <Card className="p-4 flex flex-col md:flex-row flex-wrap items-center gap-4 bg-muted/20">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Min Amount"
            type="number"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="flex-1 md:w-28"
          />
          <Input
            placeholder="Max Amount"
            type="number"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="flex-1 md:w-28"
          />
        </div>

        <Select value={createdById} onValueChange={setCreatedById}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Added By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Users</SelectItem>
            {uniqueUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Source Type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SOURCE_OPTIONS).map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 bg-background border rounded-md p-1 w-full md:w-auto">
          <Button
            variant={currency === "ALL" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrency("ALL")}
            className="flex-1 md:flex-none h-7 text-xs"
          >
            All
          </Button>
          <Button
            variant={currency === "NPR" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrency("NPR")}
            className="flex-1 md:flex-none h-7 text-xs"
          >
            NPR
          </Button>
          <Button
            variant={currency === "USD" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrency("USD")}
            className="flex-1 md:flex-none h-7 text-xs"
          >
            USD
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-40 justify-start text-xs font-normal",
                  !dateFrom && "text-muted-foreground",
                )}
              >
                <CalendarIcon data-icon="inline-start" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={fromMonth.toString()}
                    onValueChange={(v) => setFromMonth(parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {new Date(2024, i).toLocaleString("default", {
                            month: "short",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={fromYear.toString()}
                    onValueChange={(v) => setFromYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Calendar
                  mode="single"
                  month={new Date(fromYear, fromMonth)}
                  onMonthChange={(date) => {
                    setFromMonth(date.getMonth());
                    setFromYear(date.getFullYear());
                  }}
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-40 justify-start text-xs font-normal",
                  !dateTo && "text-muted-foreground",
                )}
              >
                <CalendarIcon data-icon="inline-start" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={toMonth.toString()}
                    onValueChange={(v) => setToMonth(parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {new Date(2024, i).toLocaleString("default", {
                            month: "short",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={toYear.toString()}
                    onValueChange={(v) => setToYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Calendar
                  mode="single"
                  month={new Date(toYear, toMonth)}
                  onMonthChange={(date) => {
                    setToMonth(date.getMonth());
                    setToYear(date.getFullYear());
                  }}
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              aria-label="Clear filters"
              className="shrink-0"
            >
              <TrashIcon className="size-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* LOADING OVERLAY OR NO RESULTS */}
      <div className="relative min-h-[300px]">
        {isValidating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FunnelIcon className="size-4 animate-spin" />
              <span className="text-sm font-medium">Updating...</span>
            </div>
          </div>
        )}

        {displayData.entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FunnelIcon className="size-10 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium">
              No fund entries match your filters.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting or clearing your filters.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">
                          {format(new Date(entry.receivedAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <FundSourceBadge source={entry.source} />
                            {entry.sourceLabel && (
                              <span className="text-xs text-muted-foreground">
                                {entry.sourceLabel}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {entry.note ? (
                            <Tooltip>
                              <TooltipTrigger className="truncate text-left text-sm cursor-help underline decoration-dotted underline-offset-4 decoration-border w-full">
                                {entry.note.slice(0, 60)}
                                {entry.note.length > 60 ? "..." : ""}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{entry.note}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground/50 italic text-sm">
                              No note
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {entry.createdBy.name?.charAt(0).toUpperCase() ||
                                entry.createdBy.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">
                              {entry.createdBy.name ||
                                entry.createdBy.email.split("@")[0]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-base">
                          {formatMoneyAmount(entry.amount, entry.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>

            {/* MOBILE CARDS */}
            <div className="sm:hidden">
              {displayData.entries.map((entry) => (
                <FundEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
            {/* Pagination hint */}
            {displayData.total > ((filters.limit as number) || 20) && (
              <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
                Showing initial {displayData.entries.length} out of{" "}
                {displayData.total} entries.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
