"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CredentialCopyButton } from "@/components/credentials/credential-copy-button";
import { CredentialPasswordField } from "@/components/credentials/credential-password-field";
import { cn } from "@/lib/utils";
import { useCredentialList } from "@/src/features/credentials/hooks/use-credential-list";
import { KeyIcon, ArrowRightIcon } from "@phosphor-icons/react";

type CredentialVaultWidgetProps = {
  className?: string;
};

export function CredentialVaultWidget({
  className,
}: CredentialVaultWidgetProps) {
  const { data, isLoading } = useCredentialList({ isActive: true });

  const entries = data ?? [];
  const totalActive = entries.length;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyIcon className="size-4" />
            Credential Vault
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-medium tabular-nums">
            {totalActive}
          </span>
          <Link
            href="/dashboard/credentials"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            All
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            No active credentials.
          </p>
        ) : (
          <ul className="divide-y overflow-y-auto pr-1">
            {entries.map((entry) => (
              <li key={entry.id}>
                <div className="flex items-center justify-between gap-3 rounded-md py-2.5 transition-colors hover:bg-muted/20">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {entry.appName}
                    </p>
                  </div>
                  <div className="group flex items-center gap-1">
                    <span className="text-muted-foreground truncate text-xs">
                      {entry.loginEmail.length > 18
                        ? `${entry.loginEmail.slice(0, 18)}…`
                        : entry.loginEmail}
                    </span>
                    <CredentialCopyButton
                      value={entry.loginEmail}
                      label="Email"
                    />
                  </div>
                  {entry.password ? (
                    <CredentialPasswordField
                      password={entry.password}
                      showCopy
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
