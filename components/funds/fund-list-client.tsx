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
import type { FundListQueryDTO } from "@/features/funds/validation/fund";
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
import { FundExportButton } from "@/src/features/funds/components/FundExportButton";
import type { FundExportRow } from "@/src/features/funds/types/export.types";

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

const fundExportColumns: (keyof FundExportRow)[] = [
  "date",
  "source",
  "note",
  "addedBy",
  "amount",
  "currency",
];

const fundPageSize = 20;

function getFundActiveFilters({
  amountMax,
  amountMin,
  createdById,
  currency,
  dateFrom,
  dateTo,
  source,
}: {
  amountMax: string;
  amountMin: string;
  createdById: string;
  currency: string;
  dateFrom?: Date;
  dateTo?: Date;
  source: string;
}): Record<string, string> {
  const filters: Record<string, string> = {};

  if (amountMin.trim()) filters.amountMin = amountMin.trim();
  if (amountMax.trim()) filters.amountMax = amountMax.trim();
  if (createdById !== "ALL") filters.createdById = createdById;
  if (source !== "ALL") filters.source = source;
  if (currency !== "ALL") filters.currency = currency;
  if (dateFrom) filters.dateFrom = dateFrom.toISOString();
  if (dateTo) filters.dateTo = dateTo.toISOString();

  return filters;
}

export function FundListClient({ initialData }: FundListClientProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [createdById, setCreatedById] = useState<string>("ALL");
  const [source, setSource] = useState<string>("ALL");
  const [currency, setCurrency] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
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

  const clearFilters = () => {
    setAmountMin("");
    setAmountMax("");
    setCreatedById("ALL");
    setSource("ALL");
    setCurrency("ALL");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasFilters =
    amountMin ||
    amountMax ||
    createdById !== "ALL" ||
    source !== "ALL" ||
    currency !== "ALL" ||
    dateFrom ||
    dateTo;

  const filters = useMemo<Partial<FundListQueryDTO>>(() => {
    const next: Partial<FundListQueryDTO> = {
      page,
      limit: fundPageSize,
    };
    if (amountMin) next.amountMin = parseFloat(amountMin);
    if (amountMax) next.amountMax = parseFloat(amountMax);
    if (createdById !== "ALL") next.createdById = createdById;
    if (source !== "ALL") next.source = source as FundSource;
    if (currency !== "ALL") next.currency = currency as CurrencyCode;
    if (dateFrom) next.dateFrom = dateFrom;
    if (dateTo) next.dateTo = dateTo;
    return next;
  }, [amountMax, amountMin, createdById, currency, dateFrom, dateTo, page, source]);

  const { entries, total, isLoading, isValidating } = useFundList(filters);

  // Use server data only for the initial unfiltered load. Once filters are active,
  // an empty API result must stay empty instead of falling back to all entries.
  const displayData =
    isLoading && !hasFilters
      ? initialData
      : {
          entries,
          total,
        };

  const activeFilters = useMemo(
    () =>
      getFundActiveFilters({
        amountMax,
        amountMin,
        createdById,
        currency,
        dateFrom,
        dateTo,
        source,
      }),
    [amountMax, amountMin, createdById, currency, dateFrom, dateTo, source],
  );

  const exportRows = useMemo<FundExportRow[]>(
    () =>
      displayData.entries.map((entry) => ({
        date: format(new Date(entry.receivedAt), "MMM d, yyyy"),
        source: SOURCE_OPTIONS[entry.source] ?? entry.source,
        note: entry.note ?? "",
        addedBy: entry.createdBy.name ?? entry.createdBy.email,
        amount: entry.amount,
        currency: entry.currency,
      })),
    [displayData.entries],
  );

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div
        className={cn(
          "rounded-lg border border-border px-5 py-5",
          "bg-muted/40 text-foreground",
          "dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-50",
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
          <Select
            value={source}
            onValueChange={(value) => {
              setSource(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
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

          <Select
            value={currency}
            onValueChange={(value) => {
              setCurrency(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="NPR">NPR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-xs font-normal sm:w-36",
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
                  onSelect={(date) => {
                    setDateFrom(date);
                    setPage(1);
                  }}
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
                  "w-full justify-start text-xs font-normal sm:w-36",
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
                  onSelect={(date) => {
                    setDateTo(date);
                    setPage(1);
                  }}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 border border-border bg-muted px-4 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            Advanced {advancedOpen ? "−" : "+"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            Reset filters
          </Button>
          </div>

          {advancedOpen ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 dark:border-zinc-800">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                placeholder="Min Amount"
                type="number"
                value={amountMin}
                onChange={(e) => {
                  setAmountMin(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 sm:w-32 sm:flex-none"
              />
              <Input
                placeholder="Max Amount"
                type="number"
                value={amountMax}
                onChange={(e) => {
                  setAmountMax(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 sm:w-32 sm:flex-none"
              />
            </div>
            <Select
              value={createdById}
              onValueChange={(value) => {
                setCreatedById(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
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
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              aria-label="Clear filters"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          )}
            </div>
          ) : null}
        </div>
      </div>

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
            <div className="text-muted-foreground mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                Page {page} · {displayData.entries.length} of {displayData.total} results
              </span>
              <div className="flex gap-2">
                <FundExportButton
                  rows={exportRows}
                  activeFilters={activeFilters}
                  allColumns={fundExportColumns}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page * fundPageSize >= displayData.total}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}
