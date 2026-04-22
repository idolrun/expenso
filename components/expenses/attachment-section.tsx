"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowSquareOutIcon, PaperclipIcon, TrashIcon, UploadIcon } from "@phosphor-icons/react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { AttachmentDto } from "@/features/expenses/domain/dto";

const ALLOWED_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.pdf";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentRow({
  attachment,
  onDelete,
}: {
  attachment: AttachmentDto;
  onDelete: (id: string) => void;
}) {
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleView = async () => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/attachments/${attachment.id}/view`, {
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { signedUrl: string };
        error?: { message: string };
      };
      if (!res.ok || !body.ok || !body.data) {
        toast.error(body.error?.message ?? "Could not generate view link");
        return;
      }
      window.open(body.data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Network error while generating view link");
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${attachment.fileName}"? This cannot be undone.`)) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/expenses/${attachment.expenseId}/attachments/${attachment.id}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      const body = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!res.ok || !body.ok) {
        toast.error(body.error?.message ?? "Delete failed");
        return;
      }
      toast.success("Attachment deleted");
      onDelete(attachment.id);
    } catch {
      toast.error("Network error during delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <li className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
      <PaperclipIcon className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{attachment.fileName}</p>
        {attachment.sizeBytes ? (
          <p className="text-muted-foreground text-xs">{formatBytes(attachment.sizeBytes)}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleView}
          disabled={viewLoading || deleteLoading}
          aria-label={`View ${attachment.fileName}`}
        >
          {viewLoading ? (
            <Spinner className="size-3.5" />
          ) : (
            <ArrowSquareOutIcon className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive size-7"
          onClick={handleDelete}
          disabled={viewLoading || deleteLoading}
          aria-label={`Delete ${attachment.fileName}`}
        >
          {deleteLoading ? (
            <Spinner className="size-3.5" />
          ) : (
            <TrashIcon className="size-3.5" />
          )}
        </Button>
      </div>
    </li>
  );
}

export function AttachmentSection({
  expenseId,
  initialAttachments,
  canWrite,
}: {
  expenseId: string;
  initialAttachments: AttachmentDto[];
  canWrite: boolean;
}) {
  const [attachments, setAttachments] = useState<AttachmentDto[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";

    if (!file) return;

    if (file.size > MAX_BYTES) {
      setUploadError(`File exceeds the 10 MB limit (${formatBytes(file.size)}).`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/expenses/${expenseId}/attachments`, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const body = (await res.json()) as {
        ok: boolean;
        data?: AttachmentDto;
        error?: { message: string };
      };

      if (!res.ok || !body.ok || !body.data) {
        setUploadError(body.error?.message ?? "Upload failed");
        return;
      }

      toast.success(`"${file.name}" uploaded`);
      setAttachments((prev) => [body.data!, ...prev]);
    } catch {
      setUploadError("Network error during upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Receipts & attachments</CardTitle>
            <CardDescription>
              {attachments.length === 0
                ? "No attachments yet."
                : `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached.`}
            </CardDescription>
          </div>
          {canWrite ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <UploadIcon className="size-3.5" />
                )}
                {uploading ? "Uploading…" : "Add receipt"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_ACCEPT}
                className="sr-only"
                onChange={handleFileChange}
              />
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {uploadError ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{uploadError}</AlertDescription>
          </Alert>
        ) : null}
        {attachments.length > 0 ? (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <AttachmentRow key={a.id} attachment={a} onDelete={handleDelete} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {canWrite
              ? 'Click "Add receipt" to upload JPEG, PNG, WebP, GIF, or PDF files (max 10 MB).'
              : "No receipts attached to this expense."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
