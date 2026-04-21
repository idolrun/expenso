"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ExpenseDto } from "@/features/expenses/domain/dto";
import { createExpenseAction, updateExpenseAction } from "@/features/expenses/actions/expense-actions";
import { expenseSectionValues, expenseStatusValues } from "@/features/expenses/validation/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { apiAxios } from "@/src/lib/axios";
import type { ExpenseSectionId } from "@/src/lib/expense-sections";

type TagOption = { id: string; name: string; slug: string };

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  section: ExpenseSectionId;
};

type ExpenseStatusId = (typeof expenseStatusValues)[number];

type ApiOk<T> = { ok: true; data: T };

export function ExpenseForm({
  mode,
  expense,
  tags,
  defaultSection,
}: {
  mode: "create" | "edit";
  expense?: ExpenseDto;
  tags: TagOption[];
  defaultSection?: ExpenseSectionId;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const initial = useMemo(() => {
    if (mode === "edit" && expense) {
      return {
        section: expense.section,
        status: expense.status,
        title: expense.title,
        notes: expense.notes ?? "",
        amount: expense.amount,
        currency: expense.currency,
        incurredOn: expense.incurredOn,
        categoryId: expense.categoryId ?? "",
        tagIds: expense.tags.map((t) => t.id),
      };
    }
    return {
      section: defaultSection ?? "OVERVIEW",
      status: "DRAFT" as ExpenseStatusId,
      title: "",
      notes: "",
      amount: "",
      currency: "USD",
      incurredOn: new Date().toISOString().slice(0, 10),
      categoryId: "",
      tagIds: [] as string[],
    };
  }, [mode, expense, defaultSection]);

  const [section, setSection] = useState<ExpenseSectionId>(initial.section);
  const [status, setStatus] = useState<ExpenseStatusId>(initial.status);
  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes);
  const [amount, setAmount] = useState(initial.amount);
  const [currency, setCurrency] = useState(initial.currency);
  const [incurredOn, setIncurredOn] = useState(initial.incurredOn);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void apiAxios
      .get<ApiOk<CategoryRow[]>>(`/categories`, { params: { section } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data;
        if (body.ok) setCategories(body.data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    start(async () => {
      if (mode === "create") {
        const res = await createExpenseAction({
          section,
          status,
          title: title.trim(),
          notes: notes.trim() || null,
          amount: amount.trim(),
          currency: currency.trim().toUpperCase(),
          incurredOn: incurredOn.trim(),
          categoryId: categoryId.trim() || null,
          tagIds,
        });
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success("Expense created");
        router.push(`/dashboard/expenses/${res.data.id}`);
        router.refresh();
        return;
      }

      if (!expense) return;
      const res = await updateExpenseAction({
        id: expense.id,
        section,
        status,
        title: title.trim(),
        notes: notes.trim() || null,
        amount: amount.trim(),
        currency: currency.trim().toUpperCase(),
        incurredOn: incurredOn.trim(),
        categoryId: categoryId.trim() || null,
        tagIds,
      });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Expense updated");
      router.push(`/dashboard/expenses/${res.data.id}`);
      router.refresh();
    });
  };

  return (
    <div className="bg-card space-y-6 rounded-xl border p-4 shadow-xs sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Section</Label>
          <NativeSelect
            className="w-full min-w-0"
            value={section}
            onChange={(e) => setSection(e.target.value as ExpenseSectionId)}
          >
            {expenseSectionValues.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s.replaceAll("_", " ")}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <NativeSelect
            className="w-full min-w-0"
            value={status}
            onChange={(e) => setStatus(e.target.value as ExpenseStatusId)}
          >
            {expenseStatusValues.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            maxLength={3}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incurred">Incurred on</Label>
          <Input
            id="incurred"
            type="date"
            value={incurredOn}
            onChange={(e) => setIncurredOn(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <NativeSelect
            className="w-full min-w-0"
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <NativeSelectOption value="">None</NativeSelectOption>
            {categories.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <label
              key={t.id}
              className="border-input hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm"
            >
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={tagIds.includes(t.id)}
                onChange={() => toggleTag(t.id)}
              />
              {t.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={submit}>
          {mode === "create" ? "Create expense" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
