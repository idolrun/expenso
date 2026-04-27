import { FundSource } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sourceConfig: Record<FundSource, { label: string; color: string }> = {
  BANK_TRANSFER: {
    label: "Bank Transfer",
    color: "text-[var(--color-blue)] border-[var(--color-blue)] bg-[var(--color-blue)]/5",
  },
  WALLET: {
    label: "Wallet",
    color: "text-[var(--color-purple)] border-[var(--color-purple)] bg-[var(--color-purple)]/5",
  },
  CASH: {
    label: "Cash",
    color: "text-[var(--color-success)] border-[var(--color-success)] bg-[var(--color-success)]/5",
  },
  CLIENT_PAYMENT: {
    label: "Client Payment",
    color: "text-[var(--color-warning)] border-[var(--color-warning)] bg-[var(--color-warning)]/5",
  },
  LOAN: {
    label: "Loan",
    color: "text-[var(--color-error)] border-[var(--color-error)] bg-[var(--color-error)]/5",
  },
  INVESTMENT: {
    label: "Investment",
    color: "text-[var(--color-warning)] border-[var(--color-warning)] bg-[var(--color-warning)]/5",
  },
  GRANT: {
    label: "Grant",
    color: "text-[var(--color-success)] border-[var(--color-success)] bg-[var(--color-success)]/5",
  },
  OTHER: {
    label: "Other",
    color: "text-[var(--color-text-muted)] border-[var(--color-border)] bg-[var(--color-surface-2)]",
  },
};

export function FundSourceBadge({
  source,
  className,
}: {
  source: FundSource;
  className?: string;
}) {
  const config = sourceConfig[source] || sourceConfig.OTHER;
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap px-2 py-0.5", config.color, className)}
    >
      {config.label}
    </Badge>
  );
}
