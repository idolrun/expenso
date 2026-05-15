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
  bulkArchiveExpensesAction,
} from "@/features/expenses/actions/bulk-expense-actions";
import { ExportButton } from "@/src/features/expenses/components/ExportButton";
import type { ExportRow } from "@/src/features/expenses/types/export.types";
import { XIcon, ArchiveBoxIcon } from "@phosphor-icons/react";

type BulkActionBarProps = {
  selectedIds: Set<string>;
  onClear: () => void;
  exportRows: ExportRow[];
};

export function BulkActionBar({
  selectedIds,
  onClear,
  exportRows,
}: BulkActionBarProps) {
  const [pending, startTransition] = useTransition();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const count = selectedIds.size;
  if (count === 0) return null;

  const selectedExportRows = exportRows.filter((r) =>
    selectedIds.has(r.id ?? ""),
  );

  function handleArchive() {
    startTransition(async () => {
      const res = await bulkArchiveExpensesAction([...selectedIds]);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`${res.data.archivedCount} expense(s) archived`);
      setShowArchiveDialog(false);
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
              allColumns={[
                "title",
                "date",
                "amount",
                "currency",
                "paymentType",
                "section",
              ]}
            />
          )}

          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setShowArchiveDialog(true)}
          >
            <ArchiveBoxIcon className="mr-1.5 size-3.5" />
            Archive
          </Button>

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

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {count} expenses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the selected expenses. They can be restored
              later from the Archived Expenses page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="default"
              disabled={pending}
              onClick={handleArchive}
            >
              {pending && <Spinner className="mr-2 size-4" />}
              Archive
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
