"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ClockIcon,
  ArrowSquareOut,
  KeyIcon,
  PencilIcon,
  ProhibitIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CredentialAuthBadge } from "@/components/credentials/credential-auth-badge";
import { CredentialCopyButton } from "@/components/credentials/credential-copy-button";
import { CredentialPasswordField } from "@/components/credentials/credential-password-field";
import { CredentialForm } from "@/components/credentials/credential-form";
import { CredentialHistoryPanel } from "@/components/credentials/credential-history-panel";
import type { CredentialEntryRecord } from "@/features/credentials/domain/types";
import { credentialAuthMethodValues } from "@/features/credentials/validation/credential";
import { useCredentialList } from "@/src/features/credentials/hooks/use-credential-list";
import {
  disableCredential,
  reEnableCredential,
} from "@/features/credentials/actions/credential-actions";

const AUTH_METHOD_LABELS: Record<string, string> = {
  EMAIL_PASSWORD: "Email + Password",
  OAUTH_GOOGLE: "Google",
  OAUTH_GITHUB: "GitHub",
  OAUTH_MICROSOFT: "Microsoft",
  OAUTH_OTHER: "OAuth (Other)",
  MAGIC_LINK: "Magic Link",
  PASSKEY: "Passkey",
  TWO_FACTOR_EMAIL_PASSWORD: "2FA (Email + Password)",
  TWO_FACTOR_EMAIL_APP: "2FA (Email + App)",
  SSO: "SSO",
  OTHER: "Other",
};

function FilterBar({
  search,
  setSearch,
  authMethod,
  setAuthMethod,
  showActive,
  setShowActive,
}: {
  search: string;
  setSearch: (v: string) => void;
  authMethod: string;
  setAuthMethod: (v: string) => void;
  showActive: boolean;
  setShowActive: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search apps or emails…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-w-48 flex-2"
      />
      <Select value={authMethod} onValueChange={setAuthMethod}>
        <SelectTrigger className="min-w-40 flex-1">
          <SelectValue placeholder="All methods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All methods</SelectItem>
          {credentialAuthMethodValues.map((m) => (
            <SelectItem key={m} value={m}>
              {AUTH_METHOD_LABELS[m] ?? m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Switch
          checked={showActive}
          onCheckedChange={setShowActive}
          aria-label="Show active only"
        />
        <span className="text-sm">Active only</span>
      </div>
    </div>
  );
}

function DesktopTable({
  entries,
  onEdit,
  onHistory,
  onToggleActive,
}: {
  entries: CredentialEntryRecord[];
  onEdit: (entry: CredentialEntryRecord) => void;
  onHistory: (entry: CredentialEntryRecord) => void;
  onToggleActive: (entry: CredentialEntryRecord) => void;
}) {
  return (
    <div className="hidden md:block overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>App</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Auth Method</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className={cn(
                "transition-colors",
                !entry.isActive && "opacity-50"
              )}
            >
              <TableCell className="max-w-[180px]">
                <div className="flex flex-col">
                  <span className="truncate font-medium">{entry.appName}</span>
                  {entry.appUrl ? (
                    <a
                      href={entry.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ArrowSquareOut className="size-3" />
                      <span className="truncate">{entry.appUrl}</span>
                    </a>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="group flex items-center gap-1">
                  <span className="truncate text-sm">{entry.loginEmail}</span>
                  <CredentialCopyButton value={entry.loginEmail} label="Email" />
                </div>
              </TableCell>
              <TableCell>
                <CredentialPasswordField password={entry.password} showCopy />
              </TableCell>
              <TableCell>
                <CredentialAuthBadge method={entry.authMethod} />
              </TableCell>
              <TableCell>
                {entry.twoFactorSecret || entry.authMethod.startsWith("TWO_FACTOR_") ? (
                  <CheckCircleIcon className="size-4 text-green-500" />
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {entry.isActive ? (
                  <Badge variant="outline" className="badge-tone-green">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="badge-tone-slate">
                    Disabled
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onEdit(entry)}
                    aria-label={`Edit ${entry.appName}`}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onHistory(entry)}
                    aria-label={`History for ${entry.appName}`}
                  >
                    <ClockIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onToggleActive(entry)}
                    aria-label={entry.isActive ? `Disable ${entry.appName}` : `Enable ${entry.appName}`}
                  >
                    {entry.isActive ? (
                      <ProhibitIcon className="size-4 text-destructive" />
                    ) : (
                      <CheckCircleIcon className="size-4 text-green-500" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCards({
  entries,
  onEdit,
  onHistory,
  onToggleActive,
}: {
  entries: CredentialEntryRecord[];
  onEdit: (entry: CredentialEntryRecord) => void;
  onHistory: (entry: CredentialEntryRecord) => void;
  onToggleActive: (entry: CredentialEntryRecord) => void;
}) {
  return (
    <div className="grid gap-3 md:hidden">
      {entries.map((entry) => (
        <Card
          key={entry.id}
          className={cn("shadow-xs", !entry.isActive && "opacity-50")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">{entry.appName}</CardTitle>
              <CredentialAuthBadge method={entry.authMethod} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="group flex items-center gap-1">
              <span className="truncate text-sm">{entry.loginEmail}</span>
              <CredentialCopyButton value={entry.loginEmail} label="Email" />
            </div>
            <CredentialPasswordField password={entry.password} showCopy />
            {entry.notes ? (
              <p className="text-muted-foreground text-xs">{entry.notes}</p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {entry.isActive ? (
                  <Badge variant="outline" className="badge-tone-green">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="badge-tone-slate">
                    Disabled
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onEdit(entry)}
                  aria-label={`Edit ${entry.appName}`}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onHistory(entry)}
                  aria-label={`History for ${entry.appName}`}
                >
                  <ClockIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onToggleActive(entry)}
                  aria-label={entry.isActive ? `Disable ${entry.appName}` : `Enable ${entry.appName}`}
                >
                  {entry.isActive ? (
                    <ProhibitIcon className="size-4 text-destructive" />
                  ) : (
                    <CheckCircleIcon className="size-4 text-green-500" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CredentialTable({
  initialData,
}: {
  initialData: CredentialEntryRecord[];
}) {
  const [search, setSearch] = useState("");
  const [authMethod, setAuthMethod] = useState("all");
  const [showActive, setShowActive] = useState(true);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      authMethod: authMethod === "all" ? undefined : authMethod,
      isActive: showActive ? true : undefined,
    }),
    [search, authMethod, showActive]
  );

  const { data: fetchedData, isLoading, error, refetch } = useCredentialList(filters);
  const entries = fetchedData ?? initialData;

  const [editEntry, setEditEntry] = useState<CredentialEntryRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [historyEntry, setHistoryEntry] = useState<CredentialEntryRecord | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const handleEdit = (entry: CredentialEntryRecord) => {
    setEditEntry(entry);
    setFormOpen(true);
  };

  const handleHistory = (entry: CredentialEntryRecord) => {
    setHistoryEntry(entry);
    setHistoryOpen(true);
  };

  const handleToggleActive = async (entry: CredentialEntryRecord) => {
    const result = entry.isActive
      ? await disableCredential({ id: entry.id })
      : await reEnableCredential({ id: entry.id });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(entry.isActive ? "Credential disabled" : "Credential enabled");
    void refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Credential Vault
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage team service credentials.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 self-start sm:self-auto gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <KeyIcon className="size-4" />
          Add credential
        </Button>
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        authMethod={authMethod}
        setAuthMethod={setAuthMethod}
        showActive={showActive}
        setShowActive={setShowActive}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <p>Could not load credentials.</p>
          <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading && !fetchedData ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {!isLoading && !error && entries.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyIcon className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No credentials yet</EmptyTitle>
            <EmptyDescription>Add your first one to get started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {entries.length > 0 ? (
        <>
          <DesktopTable
            entries={entries}
            onEdit={handleEdit}
            onHistory={handleHistory}
            onToggleActive={handleToggleActive}
          />
          <MobileCards
            entries={entries}
            onEdit={handleEdit}
            onHistory={handleHistory}
            onToggleActive={handleToggleActive}
          />
        </>
      ) : null}

      <CredentialForm
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => void refetch()}
      />

      <CredentialForm
        mode="edit"
        entry={editEntry ?? undefined}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => void refetch()}
      />

      {historyEntry ? (
        <CredentialHistoryPanel
          entryId={historyEntry.id}
          entryName={historyEntry.appName}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      ) : null}
    </div>
  );
}
