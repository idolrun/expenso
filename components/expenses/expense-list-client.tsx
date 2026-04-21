"use client";

import Link from "next/link";

import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import { useExpenseList } from "@/src/features/expenses/hooks/use-expense-list";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel, type ExpenseSectionId } from "@/src/lib/expense-sections";
import { ReceiptIcon } from "@phosphor-icons/react";

type TagOption = { id: string; name: string; slug: string };

export function ExpenseListClient({
  tags,
  initialQuery,
  section,
  title,
  description,
}: {
  tags: TagOption[];
  initialQuery?: Partial<ListExpensesQuery>;
  section?: ExpenseSectionId;
  title: string;
  description?: string;
}) {
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
    initialQuery: {
      ...initialQuery,
      ...(section ? { section } : {}),
    },
  });

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
          <Link href="/dashboard/expenses/new">New expense</Link>
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
            <Button type="button" size="sm" variant="secondary" onClick={() => void retry()}>
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
            <EmptyDescription>Adjust filters or create a new expense.</EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
        </Empty>
      ) : null}

      {!isLoading && !error && data && !isEmpty ? (
        <>
          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>
              Page {data.page} · {data.items.length} of {data.total} results
            </span>
            <div className="flex gap-2">
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

          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/40">
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {e.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sectionLabel(e.section)}
                      </TableCell>
                      <TableCell className="text-sm">{e.status}</TableCell>
                      <TableCell className="font-numeric text-right text-sm">
                        {formatMoneyAmount(e.amount, e.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/expenses/${e.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {data.items.map((e) => (
              <Card key={e.id} className="shadow-xs transition-shadow hover:shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">{e.title}</CardTitle>
                  <CardDescription>
                    {sectionLabel(e.section)} · {e.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 pt-0">
                  <span className="font-numeric text-lg font-semibold">
                    {formatMoneyAmount(e.amount, e.currency)}
                  </span>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/expenses/${e.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
