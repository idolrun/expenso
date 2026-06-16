"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DownloadIcon,
  FileIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CsvPreviewTable } from "@/components/expenses/csv-preview-table";
import type { SafeAttachmentDto } from "@/features/expenses/domain/dto";
import {
  parseCsvPreviewText,
  type CsvPreviewResult,
} from "@/features/attachments/utils/csv-preview";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(contentType: string | null): string {
  if (!contentType) return "File";
  if (contentType === "image/jpeg" || contentType === "image/png") return "Image";
  if (contentType === "application/pdf") return "PDF";
  if (contentType === "text/csv") return "CSV";
  return "Document";
}

function isImageAttachment(contentType: string | null): boolean {
  return contentType === "image/jpeg" || contentType === "image/png";
}

function isPdfAttachment(contentType: string | null, fileName: string): boolean {
  if (contentType === "application/pdf") return true;
  return fileName.toLowerCase().endsWith(".pdf");
}

function isCsvAttachment(contentType: string | null, fileName: string): boolean {
  if (contentType === "text/csv") return true;
  return fileName.toLowerCase().endsWith(".csv");
}

/** A previewable receipt renders an inline image (photo or PDF first page). */
function isThumbnailAttachment(
  contentType: string | null,
  fileName: string,
): boolean {
  return (
    isImageAttachment(contentType) || isPdfAttachment(contentType, fileName)
  );
}

/**
 * Stream the receipt from our download proxy and trigger a browser save.
 * The route serves the file as an attachment with its original name; fetching
 * it as a same-origin blob lets the `download` attribute keep that name.
 */
async function downloadAttachment(
  attachment: SafeAttachmentDto,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/attachments/${attachment.id}/download`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      toast.error("Could not download receipt");
      return false;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    toast.error("Network error while downloading receipt");
    return false;
  }
}

function AttachmentThumbnail({
  attachment,
}: {
  attachment: SafeAttachmentDto;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/attachments/${attachment.id}/view`, {
          credentials: "same-origin",
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok || !body.ok || !body.data?.signedUrl) {
          setError(true);
          return;
        }
        setSignedUrl(body.data.signedUrl);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchUrl();
    return () => {
      cancelled = true;
    };
  }, [attachment.id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAttachment(attachment);
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border bg-muted/20">
        <span className="text-muted-foreground text-xs">Preview unavailable</span>
      </div>
    );
  }

  if (loading || !signedUrl) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border bg-muted/20">
        <Spinner className="size-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="group relative block h-32 w-full overflow-hidden rounded-lg border"
      aria-label={`Download ${attachment.fileName}`}
      title="Click to download"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={signedUrl}
        alt={attachment.fileName}
        className="h-full w-full object-contain transition-opacity group-hover:opacity-60"
        onError={() => setError(true)}
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
        {downloading ? (
          <Spinner className="size-5 text-white" />
        ) : (
          <DownloadIcon className="size-5 text-white" weight="bold" />
        )}
      </span>
    </button>
  );
}

function CsvAttachmentPreview({
  attachment,
}: {
  attachment: SafeAttachmentDto;
}) {
  const [preview, setPreview] = useState<
    | { status: "loading" }
    | { status: "ready"; data: Extract<CsvPreviewResult, { ok: true }> }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/attachments/${attachment.id}/view`, {
          credentials: "same-origin",
        });
        const body = (await res.json()) as {
          ok: boolean;
          data?: { signedUrl: string };
        };
        if (cancelled) return;
        if (!res.ok || !body.ok || !body.data?.signedUrl) {
          setPreview({ status: "error", message: "Preview unavailable" });
          return;
        }

        const fileRes = await fetch(body.data.signedUrl);
        if (cancelled) return;
        if (!fileRes.ok) {
          setPreview({ status: "error", message: "Could not load CSV" });
          return;
        }

        const text = await fileRes.text();
        if (cancelled) return;
        const parsed = parseCsvPreviewText(text);
        if (!parsed.ok) {
          setPreview({ status: "error", message: parsed.message });
          return;
        }
        setPreview({ status: "ready", data: parsed });
      } catch {
        if (!cancelled) {
          setPreview({ status: "error", message: "Could not load CSV preview" });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [attachment.id]);

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAttachment(attachment);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <FileIcon className="text-muted-foreground size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.fileName}</p>
          <p className="text-muted-foreground text-xs">
            CSV · {formatBytes(attachment.sizeBytes)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={handleDownload}
          disabled={downloading}
          aria-label={`Download ${attachment.fileName}`}
        >
          {downloading ? (
            <Spinner className="size-3.5" />
          ) : (
            <DownloadIcon className="size-3.5" />
          )}
        </Button>
      </div>
      {preview.status === "loading" ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner className="size-4" />
        </div>
      ) : null}
      {preview.status === "error" ? (
        <p className="text-muted-foreground text-xs">{preview.message}</p>
      ) : null}
      {preview.status === "ready" ? (
        <CsvPreviewTable
          headers={preview.data.headers}
          rows={preview.data.rows}
          truncated={preview.data.truncated}
        />
      ) : null}
    </div>
  );
}

function DocumentCard({
  attachment,
}: {
  attachment: SafeAttachmentDto;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAttachment(attachment);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
      <FileIcon className="text-muted-foreground size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            {getFileTypeLabel(attachment.contentType)}
          </span>
          <span>{formatBytes(attachment.sizeBytes)}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`Download ${attachment.fileName}`}
      >
        {downloading ? (
          <Spinner className="size-3.5" />
        ) : (
          <DownloadIcon className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

export function AttachmentSection({
  attachments,
}: {
  attachments: SafeAttachmentDto[];
}) {
  const thumbnails = attachments.filter((a) =>
    isThumbnailAttachment(a.contentType, a.fileName),
  );
  const csvFiles = attachments.filter(
    (a) =>
      !isThumbnailAttachment(a.contentType, a.fileName) &&
      isCsvAttachment(a.contentType, a.fileName),
  );
  const documents = attachments.filter(
    (a) =>
      !isThumbnailAttachment(a.contentType, a.fileName) &&
      !isCsvAttachment(a.contentType, a.fileName),
  );

  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No receipts attached</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {thumbnails.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {thumbnails.map((a) => (
              <div key={a.id} className="space-y-1">
                <AttachmentThumbnail attachment={a} />
                <p className="truncate text-xs text-muted-foreground">
                  {a.fileName}
                </p>
              </div>
            ))}
          </div>
        )}
        {csvFiles.length > 0 && (
          <div className="space-y-2">
            {csvFiles.map((a) => (
              <CsvAttachmentPreview key={a.id} attachment={a} />
            ))}
          </div>
        )}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((a) => (
              <DocumentCard key={a.id} attachment={a} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
