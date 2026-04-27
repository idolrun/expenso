"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { CalendarIcon, PlusIcon } from "@phosphor-icons/react";

import { CurrencyCode, FundSource } from "@/generated/prisma/enums";
import { createFundEntry } from "@/features/funds/actions/fund-actions";
import {
  CreateFundEntryDTO,
  createFundEntrySchema,
} from "@/features/funds/validation/fund";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS: Record<FundSource, string> = {
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  CASH: "Cash",
  CLIENT_PAYMENT: "Client Payment",
  LOAN: "Loan",
  INVESTMENT: "Investment",
  GRANT: "Grant",
  OTHER: "Other",
};

export function FundAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateFundEntryDTO>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createFundEntrySchema) as any,
    defaultValues: {
      amount: undefined,
      currency: CurrencyCode.NPR,
      source: FundSource.BANK_TRANSFER,
      sourceLabel: "",
      note: "",
      receivedAt: new Date(),
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const res = await createFundEntry(data);
      if (res.success) {
        toast.success("Fund entry added successfully");
        reset();
        onOpenChange(false);
        // Mutate the local SWR cache for funds summary and list
        void mutate((key: string | readonly string[]) => {
          if (typeof key === "string" && key.startsWith("/api/funds/summary")) {
            return true;
          }
          if (Array.isArray(key) && key[0] === "/api/funds") {
            return true;
          }
          return false;
        });
      } else {
        toast.error("Failed to add fund entry.");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <FieldGroup className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                {...register("amount", { valueAsNumber: true })}
              />
              <FieldError>{errors.amount?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.currency}>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="currency" aria-invalid={!!errors.currency}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CurrencyCode.NPR}>NPR</SelectItem>
                      <SelectItem value={CurrencyCode.USD}>USD</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.currency?.message}</FieldError>
            </Field>
          </FieldGroup>

          <FieldGroup className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.source}>
              <FieldLabel htmlFor="source">Source</FieldLabel>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="source" aria-invalid={!!errors.source}>
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_OPTIONS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.source?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.sourceLabel}>
              <FieldLabel htmlFor="sourceLabel">Source Label</FieldLabel>
              <Input
                id="sourceLabel"
                placeholder="e.g. Esewa, NIC Asia..."
                aria-invalid={!!errors.sourceLabel}
                {...register("sourceLabel")}
              />
              <FieldError>{errors.sourceLabel?.message}</FieldError>
            </Field>
          </FieldGroup>

          <FieldGroup className="grid gap-4">
            <Field data-invalid={!!errors.receivedAt}>
              <FieldLabel>Date Received</FieldLabel>
              <Controller
                control={control}
                name="receivedAt"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon data-icon="inline-start" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError>{errors.receivedAt?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.note}>
              <FieldLabel htmlFor="note">Note</FieldLabel>
              <Textarea
                id="note"
                placeholder="Optional note about this fund..."
                aria-invalid={!!errors.note}
                {...register("note")}
              />
              <FieldError>{errors.note?.message}</FieldError>
            </Field>
          </FieldGroup>

          <footer className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Save
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddFundButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add Fund
      </Button>
      <FundAddDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
