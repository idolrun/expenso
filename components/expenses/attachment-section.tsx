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
import type { SafeAttachmentDto } from "@/features/expenses/domain/dto";

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
  return "Document";
}

function isImageAttachment(contentType: string | null): boolean {
  return contentType === "image/jpeg" || contentType === "image/png";
}

function AttachmentThumbnail({
  attachment,
}: {
  attachment: SafeAttachmentDto;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={signedUrl}
      alt={attachment.fileName}
      className="h-32 w-full rounded-lg border object-contain"
      onError={() => setError(true)}
    />
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
      const res = await fetch(`/api/attachments/${attachment.id}/view`, {
        credentials: "same-origin",
      });
      const body = await res.json();
      if (!res.ok || !body.ok || !body.data?.signedUrl) {
        toast.error("Could not generate download link");
        return;
      }
      window.open(body.data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Network error while generating download link");
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
  const images = attachments.filter((a) => isImageAttachment(a.contentType));
  const documents = attachments.filter((a) => !isImageAttachment(a.contentType));

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
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((a) => (
              <div key={a.id} className="space-y-1">
                <AttachmentThumbnail attachment={a} />
                <p className="truncate text-xs text-muted-foreground">
                  {a.fileName}
                </p>
              </div>
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
