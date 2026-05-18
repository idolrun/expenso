"use client";

import { useEffect, useState } from "react";
import { FileIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CsvPreviewTable } from "@/components/expenses/csv-preview-table";
import {
  isCsvReceiptFile,
  parseCsvPreviewFile,
  type CsvPreviewResult,
} from "@/features/attachments/utils/csv-preview";
import { resolveReceiptContentType } from "@/features/attachments/validation/attachment";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type CsvPreviewState =
  | { status: "ready"; preview: Extract<CsvPreviewResult, { ok: true }> }
  | { status: "error"; message: string };

function CsvReceiptPreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<CsvPreviewState | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void parseCsvPreviewFile(file).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setPreview({ status: "ready", preview: result });
        return;
      }
      setPreview({ status: "error", message: result.message });
    });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (preview === undefined) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border bg-background/60">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (preview.status === "error") {
    return <p className="text-destructive text-xs">{preview.message}</p>;
  }

  return (
    <CsvPreviewTable
      headers={preview.preview.headers}
      rows={preview.preview.rows}
      truncated={preview.preview.truncated}
    />
  );
}

export function PendingReceiptPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const isCsv = isCsvReceiptFile(file);
  const contentType = resolveReceiptContentType(file);
  const csvPreviewKey = `${file.name}-${file.size}-${file.lastModified}`;

  return (
    <li className="space-y-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <FileIcon className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-muted-foreground text-xs">
            {formatBytes(file.size)} · {contentType || "Unknown type"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>

      {isCsv ? (
        <div className="pt-1">
          <CsvReceiptPreview key={csvPreviewKey} file={file} />
        </div>
      ) : null}
    </li>
  );
}
