"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createExpenseWithAttachmentsAction,
  updateExpenseWithAttachmentsAction,
} from "@/features/expenses/actions/expense-actions";
import { createExpenseSchema } from "@/features/expenses/validation/expense";
import {
  defaultExpenseCurrency,
  expenseCurrencyValues,
  type ExpenseCurrencyCode,
} from "@/features/expenses/domain/currency";
import { paymentTypeValues } from "@/features/expenses/validation/primitives";
import type {
  ExpenseDto,
  SafeAttachmentDto,
} from "@/features/expenses/domain/dto";
import { apiAxios } from "@/src/lib/axios";
import {
  slugForSection,
  sectionLabel,
  type ExpenseSectionId,
} from "@/src/lib/labels";
import { formatMoneyAmount } from "@/src/lib/format-money";
import {
  PaperclipIcon,
  TrashIcon,
  UploadIcon,
  FileIcon,
} from "@phosphor-icons/react";
import { FormSection } from "@/components/ui/form-section";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

type TagOption = { id: string; name: string; slug: string };

type ApiOk<T> = { ok: true; data: T };

type ExchangeRatePayload = {
  rate: number;
  lastUpdated: string;
};

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

function toFormattedPreview(
  value: string,
  currency: ExpenseCurrencyCode,
): string | null {
  const amount = parseAmountInput(value);
  return amount === null
    ? null
    : formatMoneyAmount(amount.toString(), currency);
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveSalaryTitle(employeeName: string): string {
  return `Salary for ${employeeName.trim() || "Employee"}`;
}

export function ExpenseForm({
  mode,
  expense,
  tags,
  defaultSection,
  initialAttachments = [],
}: {
  mode: "create" | "edit";
  expense?: ExpenseDto;
  tags: TagOption[];
  defaultSection?: ExpenseSectionId;
  initialAttachments?: SafeAttachmentDto[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [removingAttachment, startRemoving] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null);
  const [conversionPreview, setConversionPreview] = useState<string | null>(null);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] =
    useState<SafeAttachmentDto[]>(initialAttachments);

  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);
  const [deleteAttachmentName, setDeleteAttachmentName] = useState<string>("");



  type ExpenseFormValues = {
    section: ExpenseSectionId;
    title?: string;
    notes?: string | null;
    amount: string;
    currency: ExpenseCurrencyCode;
    fromDate: string;
    toDate: string;
    tagIds?: string[];
    employeeName?: string;
    paymentType: string;
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: useMemo(() => {
      const initialCurrency =
        mode === "edit" && expense
          ? normalizeCurrency(expense.originalCurrency)
          : defaultExpenseCurrency;
      const initialAmount =
        mode === "edit" && expense ? String(expense.originalAmount) : "";

      return {
        section:
          (mode === "edit" && expense
            ? expense.section
            : (defaultSection ?? "OVERVIEW")) as ExpenseSectionId,
        title: mode === "edit" && expense ? expense.title : "",
        notes: mode === "edit" && expense ? (expense.notes ?? "") : "",
        amount: initialAmount,
        currency: initialCurrency,
        fromDate:
          mode === "edit" && expense
            ? expense.fromDate
            : new Date().toISOString().slice(0, 10),
        toDate:
          mode === "edit" && expense
            ? expense.toDate
            : new Date().toISOString().slice(0, 10),
        tagIds:
          mode === "edit" && expense
            ? expense.tags.map((t) => t.id)
            : [],
        employeeName:
          mode === "edit" && expense?.salaryRecord
            ? expense.salaryRecord.employeeName
            : "",
        paymentType: mode === "edit" && expense ? expense.paymentType : "OTHER",
      };
    }, [defaultSection, expense, mode]),
    mode: "onSubmit",
  });

  const section = watch("section");
  const currency = watch("currency");
  const amountValue = watch("amount");
  const employeeName = watch("employeeName");

  // Focus first error field after submit
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0] as keyof ExpenseFormValues | undefined;
    if (firstErrorField) {
      const el = document.getElementById(firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }
  }, [errors]);

  // Fetch exchange rate
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadExchangeRate() {
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
          throw new Error("Unable to load the exchange rate");
        }

        if (!isExchangeRatePayload(body)) {
          throw new Error("Exchange rate payload was invalid");
        }

        if (cancelled) return;
        setExchangeRate(body.rate);
        setExchangeRateError(null);
      } catch (error) {
        if (
          cancelled ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        setExchangeRate(null);
        setExchangeRateError("Exchange rate unavailable. Conversions are disabled.");
      }
    }

    void loadExchangeRate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Compute cross-currency preview
  useEffect(() => {
    const parsed = parseAmountInput(amountValue ?? "");
    if (parsed === null || !exchangeRate) {
      setConversionPreview(null);
      return;
    }
    if (currency === "USD") {
      const npr = toEditableAmount(parsed * exchangeRate);
      setConversionPreview(`≈ ${formatMoneyAmount(npr, "NPR")}`);
    } else {
      const usd = toEditableAmount(parsed / exchangeRate);
      setConversionPreview(`≈ ${formatMoneyAmount(usd, "USD")}`);
    }
  }, [amountValue, currency, exchangeRate]);

  const toggleTag = (id: string) => {
    const current = watch("tagIds") ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setValue("tagIds", next, { shouldDirty: true });
  };

  const tagIds = watch("tagIds") ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        errors.push(
          `${file.name} exceeds the 3 MB limit (${formatBytes(file.size)})`,
        );
        continue;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(
          `${file.name}: unsupported type (${file.type || "unknown"})`,
        );
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length) {
      toast.error(errors.join("; "));
    }
    if (validFiles.length) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmRemoveExisting = (attachment: SafeAttachmentDto) => {
    setDeleteAttachmentId(attachment.id);
    setDeleteAttachmentName(attachment.fileName);
  };

  const executeRemoveExisting = () => {
    if (!deleteAttachmentId || !expense) return;
    startRemoving(async () => {
      try {
        const res = await fetch(
          `/api/expenses/${expense.id}/attachments/${deleteAttachmentId}`,
          {
            method: "DELETE",
            credentials: "same-origin",
          },
        );
        const body = (await res.json()) as {
          ok: boolean;
          error?: { message: string };
        };
        if (!res.ok || !body.ok) {
          toast.error(body.error?.message ?? "Failed to remove attachment");
          return;
        }
        toast.success("Attachment removed");
        setExistingAttachments((prev) =>
          prev.filter((a) => a.id !== deleteAttachmentId),
        );
      } catch {
        toast.error("Network error while removing attachment");
      } finally {
        setDeleteAttachmentId(null);
        setDeleteAttachmentName("");
      }
    });
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    const formData = new FormData();
    formData.append("payload", JSON.stringify(values));
    for (const file of pendingFiles) {
      formData.append("files", file);
    }

    if (mode === "create") {
      const res = await createExpenseWithAttachmentsAction(formData);
      if (!res.ok) {
        if (res.error.code === "VALIDATION_ERROR") {
          toast.error(res.error.message);
        } else {
          toast.error(res.error.message);
        }
        return;
      }
      toast.success("Expense created");
      router.push(
        `/dashboard/sections/${slugForSection(values.section as ExpenseSectionId)}`,
      );
      router.refresh();
      return;
    }

    if (!expense) return;
    const updateFormData = new FormData();
    updateFormData.append(
      "payload",
      JSON.stringify({ id: expense.id, ...values }),
    );
    for (const file of pendingFiles) {
      updateFormData.append("files", file);
    }

    const res = await updateExpenseWithAttachmentsAction(updateFormData);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Expense updated");
    router.push(`/dashboard/expenses/${res.data.id}`);
    router.refresh();
  };

  const savedAmountPreview = toFormattedPreview(amountValue ?? "", currency);

  const isSalary = section === "SALARY";
  const salaryPreview = isSalary ? resolveSalaryTitle(employeeName ?? "") : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card space-y-4 rounded-xl border p-4 shadow-xs sm:space-y-6 sm:p-6"
    >
      <div className="space-y-4 sm:space-y-6">
        <FormSection title="Basic Info" step={1} totalSteps={4}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.section}>
          <FieldLabel htmlFor="section">
            Section<span className="text-destructive" aria-hidden> *</span>
          </FieldLabel>
          <Controller
            control={control}
            name="section"
            render={({ field }) => (
              <NativeSelect
                id="section"
                className="w-full min-w-0"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  clearErrors("section");
                }}
              >
                <NativeSelectOption value="">Select section</NativeSelectOption>
                {(
                  [
                    "OVERVIEW",
                    "TECH",
                    "MARKETING",
                    "SOCIAL_MEDIA",
                    "PETTY_CASH",
                    "SALARY",
                    "TRAVEL",
                  ] as ExpenseSectionId[]
                ).map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {sectionLabel(s)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          />
          <FieldError>{errors.section?.message}</FieldError>
        </Field>

        {!isSalary && (
          <Field data-invalid={!!errors.title} className="sm:col-span-2">
            <FieldLabel htmlFor="title">
              Title<span className="text-destructive" aria-hidden> *</span>
            </FieldLabel>
            <Input
              id="title"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>
        )}

        {isSalary && (
          <Field data-invalid={!!errors.employeeName} className="sm:col-span-2">
            <FieldLabel htmlFor="employeeName">
              Employee Name<span className="text-destructive" aria-hidden> *</span>
            </FieldLabel>
            <Input
              id="employeeName"
              placeholder="e.g. Jane Doe"
              {...register("employeeName")}
              aria-invalid={!!errors.employeeName}
            />
            <FieldError>{errors.employeeName?.message}</FieldError>
            {salaryPreview && (
              <p className="text-muted-foreground text-xs">
                This will be saved as: <span className="font-medium">{salaryPreview}</span>
              </p>
            )}
          </Field>
        )}

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                rows={3}
                {...register("notes")}
              />
              <FieldError>{errors.notes?.message}</FieldError>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Amount & Dates" step={2} totalSteps={4}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.currency}>
          <FieldLabel htmlFor="currency">
            Saved currency<span className="text-destructive" aria-hidden> *</span>
          </FieldLabel>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <NativeSelect
                id="currency"
                className="w-full min-w-0"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                }}
              >
                {expenseCurrencyValues.map((code) => (
                  <NativeSelectOption key={code} value={code}>
                    {code}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          />
          <FieldError>{errors.currency?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.amount}>
          <FieldLabel htmlFor="amount">
            Amount ({currency})<span className="text-destructive" aria-hidden> *</span>
          </FieldLabel>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
            aria-invalid={!!errors.amount}
          />
          <FieldError>{errors.amount?.message}</FieldError>
          <div className="flex items-center gap-2">
            {savedAmountPreview && (
              <p className="text-muted-foreground text-xs">
                Saved: {savedAmountPreview}
              </p>
            )}
            {conversionPreview && (
              <p className="text-muted-foreground text-xs">
                {conversionPreview}
              </p>
            )}
          </div>
        </Field>

        <Field data-invalid={!!errors.fromDate}>
          <FieldLabel htmlFor="fromDate">
            From Date<span className="text-destructive" aria-hidden> *</span>
          </FieldLabel>
          <Input
            id="fromDate"
            type="date"
            {...register("fromDate")}
            aria-invalid={!!errors.fromDate}
          />
          <FieldError>{errors.fromDate?.message}</FieldError>
        </Field>

            <Field data-invalid={!!errors.toDate}>
              <FieldLabel htmlFor="toDate">
                To Date<span className="text-destructive" aria-hidden> *</span>
              </FieldLabel>
              <Input
                id="toDate"
                type="date"
                {...register("toDate")}
                aria-invalid={!!errors.toDate}
              />
              <FieldError>{errors.toDate?.message}</FieldError>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Classification" step={3} totalSteps={4}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.paymentType} className="sm:col-span-2">
              <FieldLabel htmlFor="paymentType">
                Payment Type<span className="text-destructive" aria-hidden> *</span>
              </FieldLabel>
              <Controller
                control={control}
                name="paymentType"
                render={({ field }) => (
                  <NativeSelect
                    id="paymentType"
                    className="w-full min-w-0"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {paymentTypeValues.map((pt) => (
                      <NativeSelectOption key={pt} value={pt}>
                        {pt.replace(/_/g, " ")}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              />
              <FieldError>{errors.paymentType?.message}</FieldError>
            </Field>
          </div>
          <div className="mt-4">
            <Field>
              <FieldLabel>Tags</FieldLabel>
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
            </Field>
          </div>
        </FormSection>

        <FormSection title="Attachments" step={4} totalSteps={4}>
          {/* Receipts */}
          <div className="space-y-3 rounded-lg border p-4 sm:border-0 sm:p-0">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Receipts</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={pending || isSubmitting}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="size-3.5" />
            Add file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Accepted: PNG, JPEG, PDF. Max 3 MB per file.
        </p>
        {exchangeRateError && (
          <p className="text-destructive text-xs">{exchangeRateError}</p>
        )}

        {mode === "edit" && existingAttachments.length > 0 && (
          <ul className="space-y-2">
            {existingAttachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
              >
                <PaperclipIcon className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.fileName}</p>
                  {a.sizeBytes ? (
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(a.sizeBytes)}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive size-7"
                  onClick={() => confirmRemoveExisting(a)}
                  aria-label={`Remove ${a.fileName}`}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {pendingFiles.length > 0 && (
          <ul className="space-y-2">
            {pendingFiles.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
              >
                <FileIcon className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(file.size)} · {file.type || "Unknown type"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive size-7"
                  onClick={() => removePendingFile(i)}
                  aria-label={`Remove ${file.name}`}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || isSubmitting}>
          {(pending || isSubmitting) && <Spinner className="mr-2 size-4" />}
          {mode === "create" ? "Create expense" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending || isSubmitting}
        >
          Cancel
        </Button>
      </div>

        {/* Unsaved changes guard */}
        {isDirty && (
          <p className="text-muted-foreground text-xs">
            You have unsaved changes.
          </p>
        )}
        </FormSection>
      </div>

      {/* Attachment delete confirmation */}
      <AlertDialog
        open={!!deleteAttachmentId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAttachmentId(null);
            setDeleteAttachmentName("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAttachmentName
                ? `Remove "${deleteAttachmentName}" from this expense?`
                : "Remove this attachment from the expense?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingAttachment}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={removingAttachment}
              onClick={executeRemoveExisting}
            >
              {removingAttachment && <Spinner className="mr-2 size-4" />}
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
