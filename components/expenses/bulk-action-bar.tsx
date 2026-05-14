"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  bulkDeleteExpensesAction,
  bulkPayExpensesAction,
} from "@/features/expenses/actions/bulk-expense-actions";
import { ExportButton } from "@/src/features/expenses/components/ExportButton";
import type { ExportRow } from "@/src/features/expenses/types/export.types";
import { XIcon, TrashIcon, CheckCircleIcon } from "@phosphor-icons/react";

type BulkActionBarProps = {
  selectedIds: Set<string>;
  onClear: () => void;
  exportRows: ExportRow[];
  canAdmin: boolean;
  allApproved: boolean;
};

export function BulkActionBar({
  selectedIds,
  onClear,
  exportRows,
  canAdmin,
  allApproved,
}: BulkActionBarProps) {
  const [pending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const count = selectedIds.size;
  if (count === 0) return null;

  const selectedExportRows = exportRows.filter((r) =>
    selectedIds.has(r.id ?? ""),
  );

  function handleDelete() {
    startTransition(async () => {
      const res = await bulkDeleteExpensesAction([...selectedIds]);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`${res.data.deletedCount} expense(s) deleted`);
      setShowDeleteDialog(false);
      onClear();
    });
  }

  function handlePay() {
    startTransition(async () => {
      const res = await bulkPayExpensesAction([...selectedIds]);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`${res.data.paidCount} expense(s) marked as paid`);
      onClear();
    });
  }

  return (
    <>
      <div
        className="sticky bottom-4 z-30 mx-auto flex w-full max-w-3xl items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm"
        role="region"
        aria-label="Bulk actions"
      >
        <span className="text-sm font-medium tabular-nums" aria-live="polite">
          {count} selected
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selectedExportRows.length > 0 && (
            <ExportButton
              rows={selectedExportRows}
              section="selected"
              activeFilters={{}}
              allColumns={["title", "date", "amount", "currency", "status", "paymentType", "section"]}
            />
          )}

          {canAdmin && allApproved && (
            <Button
              size="sm"
              variant="default"
              disabled={pending}
              onClick={handlePay}
            >
              {pending && <Spinner className="mr-2 size-4" />}
              <CheckCircleIcon className="mr-1.5 size-3.5" />
              Mark as paid
            </Button>
          )}

          {canAdmin && (
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-1.5 size-3.5" />
              Delete
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={onClear}
            aria-label="Clear selection"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} expenses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the selected expenses. Only administrators can restore them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending && <Spinner className="mr-2 size-4" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
