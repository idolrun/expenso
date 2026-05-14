"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
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
import {
  approveExpenseAction,
  rejectExpenseAction,
} from "@/features/expenses/actions/expense-actions";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { sectionLabel } from "@/src/lib/expense-sections";
import { ReceiptIcon } from "@phosphor-icons/react";

function StatusBadge({ status }: { status: ExpenseDto["status"] }) {
  const variant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    DRAFT: "secondary",
    SUBMITTED: "default",
    APPROVED: "default",
    REJECTED: "destructive",
    PAID: "secondary",
    CANCELLED: "outline",
  };
  return <Badge variant={variant[status] ?? "outline"}>{status}</Badge>;
}

export function ApprovalQueueClient({
  expenses,
}: {
  expenses: ExpenseDto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDto | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");

  function closeDialog() {
    setSelectedExpense(null);
    setActionType(null);
    setComment("");
  }

  async function executeAction() {
    if (!selectedExpense || !actionType) return;

    startTransition(async () => {
      const res =
        actionType === "approve"
          ? await approveExpenseAction({ id: selectedExpense.id, comment: comment || undefined })
          : await rejectExpenseAction({ id: selectedExpense.id, comment: comment || undefined });

      if (!res.ok) {
        toast.error(res.error.message);
        closeDialog();
        return;
      }

      toast.success(
        actionType === "approve"
          ? "Expense approved"
          : "Expense rejected",
      );
      closeDialog();
      router.refresh();
    });
  }

  if (expenses.length === 0) {
    return (
      <Empty>
        <EmptyMedia>
          <ReceiptIcon className="size-10 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No pending approvals</EmptyTitle>
          <EmptyDescription>
            All submitted expenses have been reviewed. Check back later.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending approvals</CardTitle>
          <CardDescription>
            {expenses.length} expense{expenses.length === 1 ? "" : "s"} awaiting review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead>Submitted at</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/expenses/${expense.id}`}
                        className="font-medium hover:underline"
                      >
                        {expense.title}
                      </Link>
                    </TableCell>
                    <TableCell>{sectionLabel(expense.section)}</TableCell>
                    <TableCell>
                      {formatMoneyAmount(expense.originalAmount, expense.originalCurrency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expense.submittedBy?.name || expense.submittedBy?.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expense.submittedAt
                        ? new Date(expense.submittedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={pending}
                          onClick={() => {
                            setSelectedExpense(expense);
                            setActionType("approve");
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            setSelectedExpense(expense);
                            setActionType("reject");
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve expense" : "Reject expense"}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense?.title} —{" "}
              {formatMoneyAmount(
                selectedExpense?.originalAmount ?? "0",
                selectedExpense?.originalCurrency ?? "USD",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment (optional)
            </label>
            <Input
              id="comment"
              placeholder="Add a note..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={executeAction}
              disabled={pending}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
