"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveExpenseAction } from "@/features/expenses/actions/expense-actions";
import { ArchiveBoxIcon } from "@phosphor-icons/react";

export function ArchiveExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <ArchiveBoxIcon className="size-4" />
          Archive
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this expense?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive the expense. It can be restored later from the Archived Expenses page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="default"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const res = await archiveExpenseAction({ id: expenseId });
                if (!res.ok) {
                  toast.error(res.error.message);
                  return;
                }
                toast.success("Expense archived");
                setOpen(false);
                router.push("/dashboard/expenses");
                router.refresh();
              });
            }}
          >
            Confirm archive
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
