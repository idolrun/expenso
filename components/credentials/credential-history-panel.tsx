"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCredentialHistory } from "@/src/features/credentials/hooks/use-credential-history";

const FIELD_LABELS: Record<string, string> = {
  appName: "App Name",
  appUrl: "App URL",
  loginEmail: "Login Email",
  password: "Password",
  authMethod: "Auth Method",
  twoFactorSecret: "2FA Secret",
  notes: "Notes",
  isActive: "Status",
};

function HistoryRow({
  fieldKey,
  oldValue,
  newValue,
  changedBy,
  changedAt,
}: {
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: { id: string; name: string | null; email: string };
  changedAt: Date;
}) {
  const isPassword = fieldKey === "password";
  const label = FIELD_LABELS[fieldKey] ?? fieldKey;

  return (
    <div className="relative pl-4">
      <span className="absolute left-0 top-2 size-2 rounded-full border border-border bg-background" />
      <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {label}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(changedAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          {changedBy.name ?? changedBy.email}
        </p>
        {isPassword ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">••••••••</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground">••••••••</span>
            <Badge variant="secondary" className="h-auto px-1.5 py-0 text-[9px]">
              updated
            </Badge>
          </div>
        ) : (
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-0.5">Before</p>
              <p className="break-all font-mono text-[11px]">
                {oldValue === null || oldValue === undefined ? "—" : String(oldValue)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">After</p>
              <p className="break-all font-mono text-[11px]">
                {newValue === null || newValue === undefined ? "—" : String(newValue)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CredentialHistoryPanel({
  entryId,
  entryName,
  open,
  onOpenChange,
}: {
  entryId: string;
  entryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useCredentialHistory(entryId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>History</SheetTitle>
          <SheetDescription>
            Recent changes for <span className="font-medium">{entryName}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">No changes recorded yet.</p>
            </div>
          ) : (
            <div className="relative space-y-4 border-l border-border pl-2">
              {data.map((record) => (
                <HistoryRow
                  key={record.id}
                  fieldKey={record.fieldKey}
                  oldValue={record.oldValue}
                  newValue={record.newValue}
                  changedBy={record.changedBy}
                  changedAt={record.changedAt}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
