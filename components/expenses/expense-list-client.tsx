"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ReceiptIcon } from "@phosphor-icons/react";

import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import { ExportButton } from "@/src/features/expenses/components/ExportButton";
import { useExpenseList } from "@/src/features/expenses/hooks/use-expense-list";
import type { ExportRow } from "@/src/features/expenses/types/export.types";
import { useDisplayCurrency } from "@/src/features/display-currency/display-currency-context";
import { formatMoneyAmount } from "@/src/lib/format-money";
import {
  sectionLabel,
  type ExpenseSectionId,
} from "@/src/lib/labels";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar } from "@/components/expenses/bulk-action-bar";
import type { AppUserRole } from "@/src/lib/app-user-role";

type TagOption = { id: string; name: string; slug: string };

const expenseExportColumns: (keyof ExportRow)[] = [
  "title",
  "date",
  "amount",
  "currency",
  "paymentType",
  "section",
];

/**
 * Pick the best amount to display for `displayCurrency`.
 * Priority: exact original → stored FX snapshot → fall back to original with its currency.
 */
function resolveDisplayAmount(
  expense: ExpenseDto,
  displayCurrency: "USD" | "NPR",
): { amount: string; currency: string; isConverted: boolean } {
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
  // No snapshot yet — fall back to original
  return {
    amount: expense.originalAmount,
    currency: expense.originalCurrency,
    isConverted: false,
  };
}

function AmountCell({ expense }: { expense: ExpenseDto }) {
  const { displayCurrency } = useDisplayCurrency();
  const { amount, currency, isConverted } = resolveDisplayAmount(
    expense,
    displayCurrency,
  );
  const showOriginalBadge =
    isConverted && expense.originalAmount && expense.originalCurrency;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="font-numeric tabular-nums">
        {formatMoneyAmount(amount, currency)}
      </span>
      {showOriginalBadge ? (
        <Badge
          variant="outline"
          className="h-auto px-1.5 py-0 text-[9px] font-normal tabular-nums"
        >
          {formatMoneyAmount(expense.originalAmount, expense.originalCurrency)}
        </Badge>
      ) : null}
    </div>
  );
}

function getActiveFilters(
  query: ListExpensesQuery,
  lockedSection?: ExpenseSectionId,
): Record<string, string> {
  const filters: Record<string, string> = {};

  if (!lockedSection && query.section) filters.section = query.section;
  if (query.paymentType) filters.paymentType = query.paymentType;
  if (query.tagIds.length > 0) filters.tagIds = query.tagIds.join(",");
  if (query.amountMin?.trim()) filters.amountMin = query.amountMin.trim();
  if (query.amountMax?.trim()) filters.amountMax = query.amountMax.trim();
  if (query.dateRangeStart) filters.dateRangeStart = query.dateRangeStart;
  if (query.dateRangeEnd) filters.dateRangeEnd = query.dateRangeEnd;
  if (query.createdByEmail !== undefined)
    filters.createdByEmail = String(query.createdByEmail);
  if (query.updatedByEmail !== undefined)
    filters.updatedByEmail = String(query.updatedByEmail);
  if (query.search?.trim()) filters.search = query.search.trim();

  return filters;
}

export function ExpenseListClient({
  tags,
  initialQuery,
  section,
  title,
  description,
  userRole,
}: {
  tags: TagOption[];
  initialQuery?: Partial<ListExpensesQuery>;
  section?: ExpenseSectionId;
  title: string;
  description?: string;
  userRole?: AppUserRole;
}) {
  const router = useRouter();

  const mergedInitialQuery = useMemo<Partial<ListExpensesQuery>>(
    () => ({
      ...initialQuery,
      ...(section ? { section } : {}),
    }),
    [initialQuery, section],
  );

  const {
    data,
    error,
    isLoading,
    isEmpty,
    refetch,
    retry,
    query,
    setQuery,
    searchInput,
    setSearch,
  } = useExpenseList({
    syncUrl: true,
    initialQuery: mergedInitialQuery,
  });
  const { displayCurrency } = useDisplayCurrency();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    const pageIds = data.items.map((i) => i.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Clear selection when data changes (page/filter)
  useEffect(() => {
    clearSelection();
  }, [data?.page, query.section, query.tagIds, query.search]);

  const exportRows = useMemo<ExportRow[]>(
    () =>
      data?.items.map((expense) => {
        const { amount, currency } = resolveDisplayAmount(
          expense,
          displayCurrency,
        );

        return {
          id: expense.id,
          title: expense.title,
          date: expense.fromDate,
          amount,
          currency,
          paymentType: expense.paymentType,
          section: expense.section,
        };
      }) ?? [],
    [data?.items, displayCurrency],
  );

  const activeFilters = useMemo(
    () => getActiveFilters(query, section),
    [query, section],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
          <Link
            href={
              section
                ? `/dashboard/expenses/new?section=${section}`
                : "/dashboard/expenses/new"
            }
          >
            New expense
          </Link>
        </Button>
      </div>

      <ExpenseFilters
        query={query}
        setQuery={setQuery}
        searchInput={searchInput}
        setSearch={setSearch}
        tags={tags}
        hideSectionFilter={Boolean(section)}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load expenses</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span>{error.message}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isLoading}
              onClick={() => void retry()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {!isLoading && !error && isEmpty ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptIcon className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No expenses match</EmptyTitle>
            <EmptyDescription>
              Adjust filters or create a new expense to get started.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link
                href={
                  section
                    ? `/dashboard/expenses/new?section=${section}`
                    : "/dashboard/expenses/new"
                }
              >
                New expense
              </Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={() => void refetch()}
            >
              Refresh
            </Button>
          </div>
        </Empty>
      ) : null}

      {!isLoading && !error && data && !isEmpty ? (
        <>
          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>
              Page {data.page} · {data.items.length} of {data.total} results
            </span>
            <div className="flex gap-2">
              <ExportButton
                rows={exportRows}
                section={section ?? query.section ?? "all"}
                activeFilters={activeFilters}
                allColumns={expenseExportColumns}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setQuery({ page: Math.max(1, data.page - 1) })}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => setQuery({ page: data.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          data.items.length > 0 &&
                          data.items.every((i) => selectedIds.has(i.id))
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-25" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((e) => {
                    const href = `/dashboard/expenses/${e.id}`;
                    return (
                      <TableRow
                        key={e.id}
                        tabIndex={0}
                        aria-label={`Open expense: ${e.title}`}
                        className="cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onClick={(ev) => {
                          if (
                            (ev.target as HTMLElement).closest(
                              "a, button, [role=checkbox]",
                            )
                          )
                            return;
                          router.push(href);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key !== "Enter" && ev.key !== " ") return;
                          ev.preventDefault();
                          router.push(href);
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(e.id)}
                            onCheckedChange={() => toggleSelect(e.id)}
                            aria-label={`Select ${e.title}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-55 truncate font-medium">
                          {e.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {sectionLabel(e.section)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <AmountCell expense={e} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={href}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {data.items.map((e) => (
              <Card
                key={e.id}
                className="shadow-xs transition-shadow hover:shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base leading-snug">
                        {e.title}
                      </CardTitle>
                      <CardDescription>
                        {sectionLabel(e.section)}
                      </CardDescription>
                    </div>
                    <Checkbox
                      checked={selectedIds.has(e.id)}
                      onCheckedChange={() => toggleSelect(e.id)}
                      aria-label={`Select ${e.title}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 pt-0">
                  <AmountCell expense={e} />
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/expenses/${e.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {selectedIds.size > 0 && data && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClear={clearSelection}
          exportRows={exportRows.filter((r) => r.id && selectedIds.has(r.id))}
        />
      )}
    </div>
  );
}
