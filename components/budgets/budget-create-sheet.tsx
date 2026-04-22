"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createSectionBudgetAction } from "@/features/budgets/actions/budget-actions";
import { budgetPeriodLabels, budgetPeriodValues } from "@/features/budgets/domain/types";
import { expenseCurrencyValues } from "@/features/expenses/domain/currency";
import { expenseSectionValues } from "@/features/expenses/validation/primitives";
import type { ExpenseSection } from "@/app/generated/prisma/client";
import { sectionLabel } from "@/src/lib/expense-sections";
import type { ExpenseSectionId } from "@/src/lib/expense-sections";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultPeriodEnd(start: string, period: string): string {
  const d = new Date(`${start}T00:00:00.000Z`);
  switch (period) {
    case "MONTHLY":
      d.setUTCMonth(d.getUTCMonth() + 1);
      d.setUTCDate(d.getUTCDate() - 1);
      break;
    case "QUARTERLY":
      d.setUTCMonth(d.getUTCMonth() + 3);
      d.setUTCDate(d.getUTCDate() - 1);
      break;
    case "SEMI_ANNUAL":
      d.setUTCMonth(d.getUTCMonth() + 6);
      d.setUTCDate(d.getUTCDate() - 1);
      break;
    case "ANNUAL":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      d.setUTCDate(d.getUTCDate() - 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

export function BudgetCreateSheet({
  defaultSection,
  onCreated,
  children,
}: {
  defaultSection?: ExpenseSectionId;
  onCreated?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [section, setSection] = useState<string>(defaultSection ?? "");
  const [period, setPeriod] = useState<string>("MONTHLY");
  const [budgetCurrency, setBudgetCurrency] = useState<string>("USD");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [periodStart, setPeriodStart] = useState(today());
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd(today(), "MONTHLY"));
  const [notes, setNotes] = useState("");

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setPeriodEnd(defaultPeriodEnd(periodStart, newPeriod));
  };

  const handleStartChange = (newStart: string) => {
    setPeriodStart(newStart);
    setPeriodEnd(defaultPeriodEnd(newStart, period));
  };

  const handleSubmit = () => {
    if (!section) { toast.error("Select a section"); return; }
    if (!budgetAmount.trim()) { toast.error("Enter a budget amount"); return; }
    if (!periodStart || !periodEnd) { toast.error("Set period dates"); return; }

    start(async () => {
      const result = await createSectionBudgetAction({
        section: section as ExpenseSection,
        period,
        budgetCurrency,
        budgetAmount: budgetAmount.trim(),
        periodStart,
        periodEnd,
        notes: notes.trim() || null,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Budget created");
      setOpen(false);
      onCreated?.();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Set section budget</SheetTitle>
          <SheetDescription>
            Create a spend target for a section and period. FX snapshot will be
            captured automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section</Label>
            <NativeSelect
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="">Select section</NativeSelectOption>
              {expenseSectionValues.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {sectionLabel(s as ExpenseSectionId)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label>Period</Label>
            <NativeSelect
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full"
            >
              {budgetPeriodValues.map((p) => (
                <NativeSelectOption key={p} value={p}>
                  {budgetPeriodLabels[p]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Currency</Label>
              <NativeSelect
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className="w-full"
              >
                {expenseCurrencyValues.map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Amount</Label>
              <Input
                id="budget-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="period-start">Start date</Label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-end">End date</Label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-notes">Notes (optional)</Label>
            <Textarea
              id="budget-notes"
              rows={2}
              placeholder="Context or rationale…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={handleSubmit}
          >
            {pending ? "Creating…" : "Create budget"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
