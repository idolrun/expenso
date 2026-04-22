import Link from "next/link";
import { notFound } from "next/navigation";

import { UserRole } from "@/app/generated/prisma/client";

import { AdminDeleteExpense } from "@/components/expenses/admin-delete-expense";
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
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
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
      where: { expenseId: id },
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
  const tagNameById = Object.fromEntries(historyTags.map((t) => [t.id, t.name]));

  const hasFxSnapshot =
    expense.amountUsd !== null || expense.amountNpr !== null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{sectionLabel(expense.section)}</Badge>
            <Badge variant="outline">{expense.status}</Badge>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {expense.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Incurred {expense.incurredOn} · Updated{" "}
            {new Date(expense.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/dashboard/expenses/${id}/edit`}>Edit</Link>
          </Button>
          {role === UserRole.ADMIN ? (
            <AdminDeleteExpense expenseId={id} />
          ) : null}
        </div>
      </div>

      {/* Amount + FX snapshot */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Amount</CardTitle>
            <CardDescription>Stored as {expense.originalCurrency}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-numeric text-3xl font-semibold">
              {formatMoneyAmount(expense.originalAmount, expense.originalCurrency)}
            </p>
            {hasFxSnapshot ? (
              <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                <p className="text-muted-foreground font-medium">FX snapshot</p>
                {expense.amountUsd ? (
                  <p>
                    USD: <span className="font-medium">{formatMoneyAmount(expense.amountUsd, "USD")}</span>
                  </p>
                ) : null}
                {expense.amountNpr ? (
                  <p>
                    NPR: <span className="font-medium">{formatMoneyAmount(expense.amountNpr, "NPR")}</span>
                  </p>
                ) : null}
                {expense.fxRateUsdNpr ? (
                  <p className="text-muted-foreground">
                    Rate: 1 USD = {formatMoneyAmount(expense.fxRateUsdNpr, "NPR")}
                    {expense.fxRateSnapshotAt
                      ? ` (${new Date(expense.fxRateSnapshotAt).toLocaleDateString()})`
                      : null}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                FX snapshot not yet available. It will be captured the next time
                this expense is updated.
              </p>
            )}
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

      {/* Category & tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category & tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Category: </span>
            <span>{expense.category?.name ?? "—"}</span>
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

      {/* Receipts */}
      <AttachmentSection attachments={attachments} />

      {/* History */}
      <ExpenseHistoryTimeline entries={history} tagNameById={tagNameById} />
    </div>
  );
}
