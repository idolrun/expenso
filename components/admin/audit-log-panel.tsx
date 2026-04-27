"use client";

import { useAuditLog } from "@/src/features/audit/hooks/use-audit-log";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  auditActionValues,
  type AuditLogQuery,
} from "@/features/audit/validation/audit-log-query";
import { Skeleton } from "@/components/ui/skeleton";

export function AuditLogPanel() {
  const { data, error, isLoading, retry, query, setQuery } = useAuditLog();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Action</label>
          <NativeSelect
            className="w-full min-w-48 sm:w-56"
            value={query.action ?? ""}
            onChange={(e) =>
              setQuery({
                action: e.target.value
                  ? (e.target.value as AuditLogQuery["action"])
                  : undefined,
                page: 1,
              })
            }
          >
            <NativeSelectOption value="">All actions</NativeSelectOption>
            {auditActionValues.map((a) => (
              <NativeSelectOption key={a} value={a}>
                {a}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1 sm:flex-1">
          <label className="text-muted-foreground text-xs font-medium" htmlFor="audit-entity">
            Entity type
          </label>
          <Input
            id="audit-entity"
            placeholder="e.g. Expense"
            value={query.entityType ?? ""}
            onChange={(e) =>
              setQuery({
                entityType: e.target.value.trim() || undefined,
                page: 1,
              })
            }
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load audit log</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span>{error.message}</span>
            <Button type="button" size="sm" variant="secondary" onClick={() => void retry()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {!isLoading && !error && data ? (
        <>
          <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-xs">
            <span>
              Page {data.page} · {data.items.length} / {data.total}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setQuery({ page: Math.max(1, data.page - 1) })}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => setQuery({ page: data.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.action}</TableCell>
                    <TableCell className="text-sm">
                      <span>{row.entityType}</span>
                      {row.entityLabel ? (
                        <span className="text-muted-foreground">
                          {" "}
                          {row.entityLabel}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.actorLabel ?? row.actorId ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
