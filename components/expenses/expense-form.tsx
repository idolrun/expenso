"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createExpenseAction, updateExpenseAction } from "@/features/expenses/actions/expense-actions";
import {
  defaultExpenseCurrency,
  expenseCurrencyValues,
  type ExpenseCurrencyCode,
} from "@/features/expenses/domain/currency";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import { expenseSectionValues, expenseStatusValues } from "@/features/expenses/validation/primitives";
import { apiAxios } from "@/src/lib/axios";
import type { ExpenseSectionId } from "@/src/lib/expense-sections";
import { formatMoneyAmount } from "@/src/lib/format-money";

type TagOption = { id: string; name: string; slug: string };

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  section: ExpenseSectionId;
};

type ExpenseStatusId = (typeof expenseStatusValues)[number];
type SectionInputValue = ExpenseSectionId | "";
type StatusInputValue = ExpenseStatusId | "";

type ApiOk<T> = { ok: true; data: T };

type ExchangeRatePayload = {
  rate: number;
  lastUpdated: string;
};

const INPUT_DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </Label>
  );
}

function normalizeCurrency(currency: string | undefined): ExpenseCurrencyCode {
  return currency === "NPR" ? "NPR" : defaultExpenseCurrency;
}

function parseAmountInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d*)?$/.test(trimmed)) return null;

  const amount = Number(trimmed);
  return Number.isFinite(amount) ? amount : null;
}

function toEditableAmount(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 10000) / 10000;
  return rounded.toFixed(4).replace(/\.?0+$/, "");
}

function toFormattedPreview(value: string, currency: ExpenseCurrencyCode): string | null {
  const amount = parseAmountInput(value);
  return amount === null ? null : formatMoneyAmount(amount.toString(), currency);
}

function isExchangeRatePayload(value: unknown): value is ExchangeRatePayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "rate" in value &&
    "lastUpdated" in value &&
    typeof value.rate === "number" &&
    typeof value.lastUpdated === "string"
  );
}

function CurrencyFieldLabel({
  htmlFor,
  code,
  savedCurrency,
}: {
  htmlFor: string;
  code: ExpenseCurrencyCode;
  savedCurrency: ExpenseCurrencyCode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={htmlFor}>{code} amount</Label>
      {savedCurrency === code ? (
        <span className="text-muted-foreground text-xs">Saved</span>
      ) : null}
    </div>
  );
}

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
    const initialCurrency =
      mode === "edit" && expense
        ? normalizeCurrency(expense.originalCurrency)
        : defaultExpenseCurrency;
    const initialAmount = mode === "edit" && expense ? expense.originalAmount : "";

    return {
      section:
        mode === "edit" && expense
          ? expense.section
          : ((defaultSection ?? "") as SectionInputValue),
      status:
        mode === "edit" && expense
          ? expense.status
          : ("" as StatusInputValue),
      title: mode === "edit" && expense ? expense.title : "",
      notes: mode === "edit" && expense ? expense.notes ?? "" : "",
      usdAmount: initialCurrency === "USD" ? initialAmount : "",
      nprAmount: initialCurrency === "NPR" ? initialAmount : "",
      currency: initialCurrency,
      lastEditedCurrency: initialCurrency,
      incurredOn:
        mode === "edit" && expense
          ? expense.incurredOn
          : new Date().toISOString().slice(0, 10),
      categoryId: mode === "edit" && expense ? expense.categoryId ?? "" : "",
      tagIds: mode === "edit" && expense ? expense.tags.map((t) => t.id) : ([] as string[]),
    };
  }, [defaultSection, expense, mode]);

  const [section, setSection] = useState<SectionInputValue>(initial.section);
  const [status, setStatus] = useState<StatusInputValue>(initial.status);
  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes);
  const [usdAmount, setUsdAmount] = useState(initial.usdAmount);
  const [nprAmount, setNprAmount] = useState(initial.nprAmount);
  const [currency, setCurrency] = useState<ExpenseCurrencyCode>(initial.currency);
  const [lastEditedCurrency, setLastEditedCurrency] = useState<ExpenseCurrencyCode>(
    initial.lastEditedCurrency,
  );
  const [incurredOn, setIncurredOn] = useState(initial.incurredOn);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateLastUpdated, setRateLastUpdated] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState<string | null>(null);

  const debouncedUsdAmount = useDebouncedValue(usdAmount, INPUT_DEBOUNCE_MS);
  const debouncedNprAmount = useDebouncedValue(nprAmount, INPUT_DEBOUNCE_MS);

  useEffect(() => {
    let cancelled = false;
    if (!section) return;
    void apiAxios
      .get<ApiOk<CategoryRow[]>>("/categories", { params: { section } })
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

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadExchangeRate() {
      setRateLoading(true);
      setRateError(null);

      try {
        const response = await fetch("/api/exchange-rate", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => null)) as
          | ExchangeRatePayload
          | { error?: { message?: string } }
          | null;

        if (!response.ok) {
          const message =
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "object" &&
            body.error !== null &&
            "message" in body.error &&
            typeof body.error.message === "string"
              ? body.error.message
              : "Unable to load the exchange rate";
          throw new Error(message);
        }

        if (!isExchangeRatePayload(body)) {
          throw new Error("Exchange rate payload was invalid");
        }

        if (cancelled) return;

        setExchangeRate(body.rate);
        setRateLastUpdated(body.lastUpdated);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setExchangeRate(null);
        setRateLastUpdated(null);
        setRateError(
          error instanceof Error ? error.message : "Unable to load the exchange rate",
        );
      } finally {
        if (!cancelled) {
          setRateLoading(false);
        }
      }
    }

    void loadExchangeRate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!exchangeRate) return;

    const timeout = window.setTimeout(() => {
      if (lastEditedCurrency === "USD") {
        const parsedUsdAmount = parseAmountInput(debouncedUsdAmount);
        const nextNprAmount =
          parsedUsdAmount === null ? "" : toEditableAmount(parsedUsdAmount * exchangeRate);

        setNprAmount((current) => (current === nextNprAmount ? current : nextNprAmount));
        return;
      }

      const parsedNprAmount = parseAmountInput(debouncedNprAmount);
      const nextUsdAmount =
        parsedNprAmount === null ? "" : toEditableAmount(parsedNprAmount / exchangeRate);

      setUsdAmount((current) => (current === nextUsdAmount ? current : nextUsdAmount));
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [debouncedNprAmount, debouncedUsdAmount, exchangeRate, lastEditedCurrency]);

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAmountChange = (targetCurrency: ExpenseCurrencyCode, value: string) => {
    if (targetCurrency === "USD") {
      setUsdAmount(value);
    } else {
      setNprAmount(value);
    }
    setLastEditedCurrency(targetCurrency);
  };

  const handleSectionChange = (value: SectionInputValue) => {
    setSection(value);
    setCategoryId("");
    setCategories([]);
  };

  const resolveSubmissionAmount = (targetCurrency: ExpenseCurrencyCode) => {
    const directValue = (targetCurrency === "USD" ? usdAmount : nprAmount).trim();

    if (lastEditedCurrency === targetCurrency) {
      return directValue;
    }

    const sourceValue = lastEditedCurrency === "USD" ? usdAmount : nprAmount;
    const sourceNumber = parseAmountInput(sourceValue);
    if (sourceNumber === null || !exchangeRate) {
      return directValue;
    }

    return lastEditedCurrency === "USD"
      ? toEditableAmount(sourceNumber * exchangeRate)
      : toEditableAmount(sourceNumber / exchangeRate);
  };

  const submit = () => {
    start(async () => {
      if (!section) {
        toast.error("Section is required");
        return;
      }

      const amount = resolveSubmissionAmount(currency);
      if (!amount) {
        toast.error(`Enter an amount in ${currency}`);
        return;
      }

      const payload = {
        section,
        ...(status ? { status } : {}),
        title: title.trim(),
        notes: notes.trim() || null,
        amount,
        currency,
        incurredOn: incurredOn.trim(),
        categoryId: categoryId.trim() || null,
        tagIds,
      };

      if (mode === "create") {
        const res = await createExpenseAction(payload);
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
        ...payload,
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

  const savedAmountPreview = toFormattedPreview(resolveSubmissionAmount(currency), currency);
  const usdPreview = toFormattedPreview(usdAmount, "USD");
  const nprPreview = toFormattedPreview(nprAmount, "NPR");
  const ratePreview =
    exchangeRate === null ? null : formatMoneyAmount(exchangeRate.toString(), "NPR");
  const rateUpdatedPreview = rateLastUpdated
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(rateLastUpdated))
    : null;

  return (
    <div className="bg-card space-y-6 rounded-xl border p-4 shadow-xs sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel>Section</RequiredLabel>
          <NativeSelect
            className="w-full min-w-0"
            value={section}
            onChange={(e) => handleSectionChange(e.target.value as SectionInputValue)}
            required
          >
            <NativeSelectOption value="">Select section</NativeSelectOption>
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
            onChange={(e) => setStatus(e.target.value as StatusInputValue)}
          >
            <NativeSelectOption value="">Select status</NativeSelectOption>
            {expenseStatusValues.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <RequiredLabel htmlFor="title">Title</RequiredLabel>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="space-y-2">
          <CurrencyFieldLabel htmlFor="amount-usd" code="USD" savedCurrency={currency} />
          <Input
            id="amount-usd"
            inputMode="decimal"
            placeholder="0.00"
            value={usdAmount}
            onChange={(e) => handleAmountChange("USD", e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {usdPreview ?? "Type in USD to calculate NPR automatically."}
          </p>
        </div>

        <div className="space-y-2">
          <CurrencyFieldLabel htmlFor="amount-npr" code="NPR" savedCurrency={currency} />
          <Input
            id="amount-npr"
            inputMode="decimal"
            placeholder="0.00"
            value={nprAmount}
            onChange={(e) => handleAmountChange("NPR", e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {nprPreview ?? "Type in NPR to calculate USD automatically."}
          </p>
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor="currency">Saved currency</RequiredLabel>
          <NativeSelect
            className="w-full min-w-0"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as ExpenseCurrencyCode)}
          >
            {expenseCurrencyValues.map((code) => (
              <NativeSelectOption key={code} value={code}>
                {code}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor="incurred">Incurred on</RequiredLabel>
          <Input
            id="incurred"
            type="date"
            required
            value={incurredOn}
            onChange={(e) => setIncurredOn(e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">Live USD/NPR conversion</p>
            {rateLoading ? (
              <p className="text-muted-foreground mt-1 text-sm">Loading the latest rate...</p>
            ) : rateError ? (
              <p className="text-destructive mt-1 text-sm">{rateError}</p>
            ) : (
              <p className="mt-1 text-sm">1 USD = {ratePreview}</p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {savedAmountPreview
                ? `This expense will be saved as ${savedAmountPreview}.`
                : `Choose the saved currency and enter an amount in USD or NPR.`}
            </p>
            {rateUpdatedPreview ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Last updated {rateUpdatedPreview}. Conversion input sync is debounced by{" "}
                {INPUT_DEBOUNCE_MS}ms.
              </p>
            ) : null}
          </div>
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

      {mode === "create" ? (
        <div className="rounded-lg border border-dashed bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Receipts: </span>
          Save the expense first, then open it to upload receipt attachments.
        </div>
      ) : null}

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
