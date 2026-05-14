"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Spinner } from "@/components/ui/spinner";
import { restoreExpenseAction, purgeExpenseAction } from "@/features/expenses/actions/trash-actions";
import { sectionLabel, statusLabel } from "@/src/lib/labels";
import { formatMoneyAmount } from "@/src/lib/format-money";
import { format } from "date-fns";
import { TrashIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

type TrashItem = {
  id: string;
  title: string;
  section: string;
  status: string;
  originalAmount: string;
  originalCurrency: string;
  deletedAt: string | null;
  createdByLabel: string;
};

export function TrashListClient({ initialItems }: { initialItems: TrashItem[] }) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [restorePending, startRestore] = useTransition();
  const [purgePending, startPurge] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleRestore = (id: string) => {
    setActiveId(id);
    startRestore(async () => {
      const res = await restoreExpenseAction(id);
      if (!res.ok) {
        toast.error(res.error.message);
        setActiveId(null);
        return;
      }
      toast.success("Expense restored");
      setItems((prev) => prev.filter((i) => i.id !== id));
      setActiveId(null);
    });
  };

  const handlePurge = (id: string) => {
    setActiveId(id);
    startPurge(async () => {
      const res = await purgeExpenseAction(id);
      if (!res.ok) {
        toast.error(res.error.message);
        setActiveId(null);
        return;
      }
      toast.success("Expense permanently deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
      setActiveId(null);
    });
  };

  if (items.length === 0) {
    return (
      <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
        <TrashIcon className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">Trash is empty.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead className="w-40">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-48 truncate font-medium">{item.title}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {sectionLabel(item.section)}
              </TableCell>
              <TableCell className="text-sm">{statusLabel(item.status)}</TableCell>
              <TableCell className="text-right text-sm font-numeric">
                {formatMoneyAmount(item.originalAmount, item.originalCurrency)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.deletedAt ? format(new Date(item.deletedAt), "MMM d, yyyy") : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={restorePending && activeId === item.id}
                    onClick={() => handleRestore(item.id)}
                  >
                    {restorePending && activeId === item.id ? (
                      <Spinner className="mr-1.5 size-3" />
                    ) : (
                      <ArrowCounterClockwiseIcon className="mr-1.5 size-3" />
                    )}
                    Restore
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={purgePending && activeId === item.id}
                      >
                        {purgePending && activeId === item.id ? (
                          <Spinner className="mr-1.5 size-3" />
                        ) : (
                          <TrashIcon className="mr-1.5 size-3" />
                        )}
                        Purge
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove <strong>{item.title}</strong> and all its
                          attachments. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={purgePending}
                          onClick={() => handlePurge(item.id)}
                        >
                          {purgePending && activeId === item.id && (
                            <Spinner className="mr-2 size-4" />
                          )}
                          Permanently Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
