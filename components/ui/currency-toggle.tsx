"use client";

import { cn } from "@/lib/utils";
import type { DisplayCurrencyCode } from "@/src/features/display-currency/display-currency-context";

export function CurrencyToggle({
  value,
  onChange,
  className,
}: {
  value: DisplayCurrencyCode;
  onChange: (c: DisplayCurrencyCode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5",
        className,
      )}
      role="group"
      aria-label="Display currency"
    >
      {(["USD", "NPR"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={cn(
            "rounded-[3px] px-2.5 py-1 text-xs font-medium transition-all",
            value === c
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
