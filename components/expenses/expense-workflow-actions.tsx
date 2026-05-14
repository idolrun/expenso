"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import {
  submitForApprovalAction,
  approveExpenseAction,
  rejectExpenseAction,
  payExpenseAction,
  cancelExpenseAction,
} from "@/features/expenses/actions/expense-actions";
import type { AppUserRole } from "@/src/lib/app-user-role";

export function ExpenseWorkflowActions({
  expense,
  currentUserId,
  role,
}: {
  expense: ExpenseDto;
  currentUserId: string;
  role: AppUserRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    "approve" | "reject" | "cancel" | null
  >(null);
  const [comment, setComment] = useState("");

  const isAdmin = role === "ADMIN";
  const isApprover = role === "ADMIN" || role === "APPROVER";
  const isOwner = expense.createdById === currentUserId;

  function openDialog(action: "approve" | "reject" | "cancel") {
    setDialogAction(action);
    setComment("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDialogAction(null);
    setComment("");
  }

  async function executeAction() {
    if (!dialogAction) return;

    startTransition(async () => {
      let res;
      switch (dialogAction) {
        case "approve":
          res = await approveExpenseAction({ id: expense.id, comment: comment || undefined });
          break;
        case "reject":
          res = await rejectExpenseAction({ id: expense.id, comment: comment || undefined });
          break;
        case "cancel":
          res = await cancelExpenseAction({ id: expense.id });
          break;
      }

      if (!res!.ok) {
        toast.error(res!.error.message);
        closeDialog();
        return;
      }

      toast.success(
        dialogAction === "approve"
          ? "Expense approved"
          : dialogAction === "reject"
            ? "Expense rejected"
            : "Expense cancelled",
      );
      closeDialog();
      router.refresh();
    });
  }

  async function handleSubmitForApproval() {
    startTransition(async () => {
      const res = await submitForApprovalAction({ id: expense.id });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Submitted for approval");
      router.refresh();
    });
  }

  async function handlePay() {
    startTransition(async () => {
      const res = await payExpenseAction({ id: expense.id });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Marked as paid");
      router.refresh();
    });
  }

  const buttons: React.ReactNode[] = [];

  if (expense.status === "DRAFT" && (isOwner || isAdmin)) {
    buttons.push(
      <Button
        key="submit"
        size="sm"
        variant="default"
        disabled={pending}
        onClick={handleSubmitForApproval}
      >
        Submit for Approval
      </Button>,
    );
  }

  if (expense.status === "SUBMITTED" && isApprover) {
    const isSelf = expense.submittedById === currentUserId;
    if (!isSelf || isAdmin) {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="default"
          disabled={pending}
          onClick={() => openDialog("approve")}
        >
          Approve
        </Button>,
      );
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => openDialog("reject")}
        >
          Reject
        </Button>,
      );
    }
  }

  if (expense.status === "APPROVED" && isApprover) {
    buttons.push(
      <Button
        key="pay"
        size="sm"
        variant="default"
        disabled={pending}
        onClick={handlePay}
      >
        Mark as Paid
      </Button>,
    );
  }

  if (
    ["DRAFT", "SUBMITTED", "REJECTED"].includes(expense.status) &&
    (isAdmin || isOwner)
  ) {
    buttons.push(
      <Button
        key="cancel"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => openDialog("cancel")}
      >
        Cancel
      </Button>,
    );
  }

  if (buttons.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">{buttons}</div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve"
                ? "Approve expense"
                : dialogAction === "reject"
                  ? "Reject expense"
                  : "Cancel expense"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {dialogAction} this expense?
            </DialogDescription>
          </DialogHeader>
          {(dialogAction === "approve" || dialogAction === "reject") && (
            <div className="space-y-3">
              <label htmlFor="wf-comment" className="text-sm font-medium">
                Comment (optional)
              </label>
              <Input
                id="wf-comment"
                placeholder="Add a note..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === "reject" || dialogAction === "cancel" ? "destructive" : "default"}
              onClick={executeAction}
              disabled={pending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
