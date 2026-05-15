import Link from "next/link";
import { notFound } from "next/navigation";

import { UserRole } from "@/generated/prisma/client";

import { ArchiveExpenseButton } from "@/components/expenses/archive-expense-button";
import { AttachmentSection } from "@/components/expenses/attachment-section";
import { ExpenseHistoryTimeline } from "@/components/expenses/expense-history-timeline";
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
  listExpenseHistoryForExpense,
  getExpenseById,
} from "@/features/expenses/application/expense-query.service";
import { serializeAttachmentForClient } from "@/features/expenses/domain/serialize";
import { requireAuth } from "@/lib/auth/guards";
import { parseUserRole } from "@/lib/auth/session";
import { sessionToUserId } from "@/lib/auth/actor";
import { prisma } from "@/lib/prisma";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel } from "@/src/lib/expense-sections";

function collectTagIds(value: unknown): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        return parsed;
      }
    } catch {
      return [];
    }
  }
  return [];
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  const { id } = await params;

  const [expRes, histRes, attachmentRows] = await Promise.all([
    getExpenseById(id),
    listExpenseHistoryForExpense(id),
    prisma.attachment.findMany({
      where: { expenseId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!expRes.ok) notFound();

  const expense = expRes.data;
  const history = histRes.ok ? histRes.data : [];
  const attachments = attachmentRows.map(serializeAttachmentForClient);

  const historyTagIds = [
    ...new Set(
      history
        .filter((e) => e.fieldKey === "tagIds")
        .flatMap((e) => [
          ...collectTagIds(e.oldValue),
          ...collectTagIds(e.newValue),
        ]),
    ),
  ];
  const historyTags = historyTagIds.length
    ? await prisma.tag.findMany({
        where: { id: { in: historyTagIds } },
        select: { id: true, name: true },
      })
    : [];
  const tagNameById = Object.fromEntries(
    historyTags.map((t) => [t.id, t.name]),
  );

  const hasFxSnapshot =
    expense.amountUsd !== null || expense.amountNpr !== null;

  const currentUserId = sessionToUserId(session);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{sectionLabel(expense.section)}</Badge>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {expense.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            From {expense.fromDate} To {expense.toDate} · Updated{" "}
            {new Date(expense.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/dashboard/expenses/${id}/edit`}>Edit</Link>
          </Button>
          <ArchiveExpenseButton expenseId={id} />
        </div>
      </div>

      {/* Amount + FX snapshot */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Amount</CardTitle>
            <CardDescription>
              Stored as {expense.originalCurrency}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-numeric text-3xl font-semibold">
              {formatMoneyAmount(
                expense.originalAmount,
                expense.originalCurrency,
              )}
            </p>
            {hasFxSnapshot ? (
              <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                <p className="text-muted-foreground font-medium">FX snapshot</p>
                {expense.amountUsd ? (
                  <p>
                    USD:{" "}
                    <span className="font-medium">
                      {formatMoneyAmount(expense.amountUsd, "USD")}
                    </span>
                  </p>
                ) : null}
                {expense.amountNpr ? (
                  <p>
                    NPR:{" "}
                    <span className="font-medium">
                      {formatMoneyAmount(expense.amountNpr, "NPR")}
                    </span>
                  </p>
                ) : null}
                {expense.fxRateUsdNpr ? (
                  <p className="text-muted-foreground">
                    Rate: 1 USD ={" "}
                    {formatMoneyAmount(expense.fxRateUsdNpr, "NPR")}
                    {expense.fxRateSnapshotAt
                      ? ` (${new Date(expense.fxRateSnapshotAt).toLocaleDateString()})`
                      : null}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                FX snapshot not yet available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Date Range</CardTitle>
            <CardDescription>
              {expense.section === "SALARY"
                ? "Salary Period"
                : "Expense Period"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                From Date
              </p>
              <p className="mt-1 font-medium">
                {new Date(expense.fromDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                To Date
              </p>
              <p className="mt-1 font-medium">
                {new Date(expense.toDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">
              {expense.notes?.trim() ? expense.notes : "No notes."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attachments + Category & tags */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AttachmentSection attachments={attachments} />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payment Type &amp; tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Payment Type: </span>
              <span>{expense.paymentType.replace(/_/g, " ")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {expense.tags.length === 0 ? (
                <span className="text-muted-foreground">No tags</span>
              ) : (
                expense.tags.map((t) => (
                  <Badge key={t.id} variant="outline">
                    {t.name}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <ExpenseHistoryTimeline entries={history} tagNameById={tagNameById} />
    </div>
  );
}
