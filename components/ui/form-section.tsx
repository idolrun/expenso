"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CaretDownIcon } from "@phosphor-icons/react";

interface FormSectionProps {
  title: string;
  step: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function FormSection({
  title,
  step,
  children,
  defaultOpen = true,
  className,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card sm:border-0 sm:bg-transparent",
        className,
      )}
    >
      {/* Mobile step header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 sm:hidden"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {step}
          </span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <CaretDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all",
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
          "sm:max-h-none sm:opacity-100",
          open && "px-4 pb-4 sm:px-0 sm:pb-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}
