import { Readable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";

import { AuditAction } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

import type { AttachmentDto, ServiceResult } from "@/features/expenses/domain/dto";
import { serializeAttachment } from "@/features/expenses/domain/serialize";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { attachmentRepository } from "@/features/attachments/infrastructure/attachment.repository";
import type { UserRole } from "@/generated/prisma/client";
import {
  attachmentValidationMessage,
  sanitizeFilename,
  validateReceiptFile,
} from "@/features/attachments/validation/attachment";
import {
  cloudinary,
  cloudinaryResourceType,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "@/features/expenses/infrastructure/db.types";

// ─── Cloudinary upload helper ────────────────────────────────────────────────

/** Wrap Cloudinary's callback-based upload_stream in a Promise. */
function streamUploadToCloudinary(
  buffer: Buffer,
  options: Record<string, unknown>,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload returned no result"));
        } else {
          resolve(result);
        }
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

// ─── Access event logging ────────────────────────────────────────────────────
// Signed-URL requests are high-frequency read events. We emit a structured
// JSON log line rather than writing to the DB audit table (which is reserved
// for state-changing events). In production, pipe stdout to a log aggregator.

function logAttachmentAccess(event: {
  attachmentId: string;
  expenseId: string;
  userId: string;
  expiresAt: number;
}): void {
  process.stdout.write(
    JSON.stringify({
      event: "attachment_access",
      ...event,
      ts: new Date().toISOString(),
    }) + "\n",
  );
}

// ─── Transactional upload helper ─────────────────────────────────────────────

/**
 * Upload a file to Cloudinary and persist the attachment record inside an
 * existing Prisma transaction. This is used by expense create/edit flows so
 * that attachment failures surface to the user before they are redirected.
 */
export async function uploadAttachmentInTransaction(
  tx: Prisma.TransactionClient,
  expenseId: string,
  file: File,
  actorUserId: string,
): Promise<AttachmentDto> {
  const validationError = validateReceiptFile(file);
  if (validationError) {
    throw new Error(attachmentValidationMessage(validationError));
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const year = new Date().getFullYear();
  const folder = `expenso/receipts/${year}`;
  const safeBase = sanitizeFilename(file.name).replace(/\.[^.]+$/, "");

  const uploadResult = await streamUploadToCloudinary(buffer, {
    folder,
    type: "authenticated",
    resource_type: "auto",
    public_id: `${expenseId}/${Date.now()}_${safeBase}`,
    overwrite: false,
  });

  const safeFileName = sanitizeFilename(file.name);

  const row = await attachmentRepository.create(tx, {
    expense: { connect: { id: expenseId } },
    provider: "CLOUDINARY",
    storageKey: uploadResult.public_id,
    cloudinaryPublicId: uploadResult.public_id,
    cloudinaryVersion: uploadResult.version,
    cloudinaryFolder: folder,
    cloudinaryFormat: uploadResult.format ?? null,
    fileName: safeFileName,
    contentType: file.type || null,
    sizeBytes: file.size,
    isPrivate: true,
    uploadedBy: { connect: { id: actorUserId } },
  });

  await auditLogRepository.create(tx, {
    action: AuditAction.ATTACHMENT_ADDED,
    entityType: "Attachment",
    entityId: row.id,
    actor: { connect: { id: actorUserId } },
    metadata: {
      expenseId,
      fileName: safeFileName,
      sizeBytes: file.size,
      cloudinaryPublicId: uploadResult.public_id,
    },
  });

  return serializeAttachment(row);
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export async function uploadAttachmentService(
  expenseId: string,
  file: File,
  actorUserId: string,
): Promise<ServiceResult<AttachmentDto>> {
  // 1. Validate file before any DB or network work.
  const validationError = validateReceiptFile(file);
  if (validationError) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: attachmentValidationMessage(validationError),
      },
    };
  }

  // 2. Verify the expense exists and is not deleted.
  const expense = await expenseRepository.findActiveById(prisma, expenseId);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  try {
    // 3. Upload to Cloudinary — type:"authenticated" prevents public access.
    const buffer = Buffer.from(await file.arrayBuffer());
    const year = new Date().getFullYear();
    const folder = `expenso/receipts/${year}`;
    // Sanitize filename before using it as a public_id component.
    const safeBase = sanitizeFilename(file.name).replace(/\.[^.]+$/, ""); // strip ext

    const uploadResult = await streamUploadToCloudinary(buffer, {
      folder,
      type: "authenticated",
      resource_type: "auto",
      public_id: `${expenseId}/${Date.now()}_${safeBase}`,
      overwrite: false,
    });

    // 4. Persist sanitized metadata in the DB.
    const safeFileName = sanitizeFilename(file.name);

    const attachment = await prisma.$transaction(async (tx) => {
      const row = await attachmentRepository.create(tx, {
        expense: { connect: { id: expenseId } },
        provider: "CLOUDINARY",
        storageKey: uploadResult.public_id,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryVersion: uploadResult.version,
        cloudinaryFolder: folder,
        cloudinaryFormat: uploadResult.format ?? null,
        // Store the sanitized name — never the raw user-supplied value.
        fileName: safeFileName,
        contentType: file.type || null,
        sizeBytes: file.size,
        isPrivate: true,
        uploadedBy: { connect: { id: actorUserId } },
      });

      await auditLogRepository.create(tx, {
        action: AuditAction.ATTACHMENT_ADDED,
        entityType: "Attachment",
        entityId: row.id,
        actor: { connect: { id: actorUserId } },
        metadata: {
          expenseId,
          // Sanitized filename is safe to log; never log the raw input.
          fileName: safeFileName,
          sizeBytes: file.size,
          cloudinaryPublicId: uploadResult.public_id,
        },
      });

      return row;
    });

    return { ok: true, data: serializeAttachment(attachment) };
  } catch (e) {
    const message =
      e instanceof Error
        ? `Upload failed: ${e.message}`
        : "Upload failed due to an unexpected error";
    return { ok: false, error: { code: "UPLOAD_FAILED", message } };
  }
}

// ─── List ────────────────────────────────────────────────────────────────────

export async function listAttachmentsService(
  expenseId: string,
): Promise<ServiceResult<AttachmentDto[]>> {
  try {
    const expense = await expenseRepository.findActiveById(prisma, expenseId);
    if (!expense) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
    }

    const rows = await attachmentRepository.findActiveByExpenseId(prisma, expenseId);
    return { ok: true, data: rows.map(serializeAttachment) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "List failed";
    return { ok: false, error: { code: "LIST_FAILED", message } };
  }
}

// ─── Archive ─────────────────────────────────────────────────────────────────

export async function archiveAttachmentService(
  attachmentId: string,
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const attachment = await attachmentRepository.findById(prisma, attachmentId);
    if (!attachment) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Attachment not found" } };
    }

    // Verify the related expense is still accessible.
    const expense = await expenseRepository.findActiveById(prisma, attachment.expenseId);
    if (!expense) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Related expense not found or archived" },
      };
    }

    // Note: Cloudinary asset is NOT destroyed. The attachment record is archived
    // (deletedAt set) but the underlying cloud asset and metadata remain for
    // audit integrity and recovery. This is a non-destructive operation.

    await prisma.$transaction(async (tx) => {
      await attachmentRepository.archive(tx, attachmentId, actorUserId);
      await auditLogRepository.create(tx, {
        action: AuditAction.ATTACHMENT_ARCHIVED,
        entityType: "Attachment",
        entityId: attachmentId,
        actor: { connect: { id: actorUserId } },
        metadata: {
          expenseId: attachment.expenseId,
          fileName: attachment.fileName,
        },
      });
    });

    return { ok: true, data: { id: attachmentId } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Archive failed";
    return { ok: false, error: { code: "ARCHIVE_FAILED", message } };
  }
}

// ─── Signed URL generation ───────────────────────────────────────────────────

/** Maximum lifetime (seconds) for a signed Cloudinary delivery URL. */
const SIGNED_URL_TTL_SECONDS = 60;

export type SignedUrlPayload = {
  signedUrl: string;
  /** Unix epoch (seconds) when the URL becomes invalid. */
  expiresAt: number;
};

/** Resolve the file extension to use when constructing a Cloudinary URL. */
function cloudinaryFormatFor(
  attachment: { cloudinaryFormat: string | null; contentType: string | null },
  resourceType: "image" | "raw" | "video",
): string {
  if (attachment.cloudinaryFormat) {
    return attachment.cloudinaryFormat.replace(/^\./, "");
  }
  // Raw assets (e.g. CSV) are stored without a format extension.
  if (resourceType === "raw") return "";
  switch (attachment.contentType?.toLowerCase()) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    default:
      return "";
  }
}

/**
 * Generate a short-lived signed Cloudinary delivery URL for inline preview.
 *
 * Images and CSVs are delivered directly; PDFs are rendered as a first-page
 * JPG because Cloudinary blocks inline delivery of original PDF files.
 *
 * Access control:
 *   - Session validation is performed by the route handler before this call.
 *   - Expense existence is re-verified here (defense in depth).
 *   - Permanent or public Cloudinary URLs are never returned.
 *
 * @param attachmentId   The attachment to serve.
 * @param actorUserId    The authenticated user requesting access (for the access log).
 */
export async function getSignedAttachmentUrlService(
  attachmentId: string,
  actorUserId: string,
): Promise<ServiceResult<SignedUrlPayload>> {
  try {
    const attachment = await attachmentRepository.findById(prisma, attachmentId);
    if (!attachment) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Attachment not found" } };
    }

    // Defense-in-depth: verify the parent expense still exists.
    const expense = await expenseRepository.findActiveById(
      prisma,
      attachment.expenseId,
    );
    if (!expense) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Related expense not found or deleted",
        },
      };
    }

    // LOCAL provider: no Cloudinary — signed URL not supported.
    if (attachment.provider !== "CLOUDINARY" || !attachment.cloudinaryPublicId) {
      return {
        ok: false,
        error: {
          code: "UNSUPPORTED_PROVIDER",
          message: "Signed URL generation is only supported for Cloudinary assets",
        },
      };
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
    const resourceType = cloudinaryResourceType(
      attachment.contentType,
      attachment.cloudinaryFormat,
    );
    const isPdf =
      attachment.contentType?.toLowerCase() === "application/pdf" ||
      attachment.cloudinaryFormat?.toLowerCase() === "pdf";

    let signedUrl: string;
    if (isPdf) {
      // Cloudinary blocks inline delivery of original PDFs, so preview the
      // first page rendered as a JPG image.
      signedUrl = cloudinary.url(attachment.cloudinaryPublicId, {
        type: "authenticated",
        resource_type: "image",
        format: "jpg",
        page: 1,
        secure: true,
        sign_url: true,
      });
    } else {
      signedUrl = cloudinary.url(attachment.cloudinaryPublicId, {
        type: "authenticated",
        resource_type: resourceType,
        secure: true,
        sign_url: true,
      });
    }

    // Emit a structured access log (high-volume event → stdout, not audit DB).
    logAttachmentAccess({
      attachmentId,
      expenseId: attachment.expenseId,
      userId: actorUserId,
      expiresAt,
    });

    return { ok: true, data: { signedUrl, expiresAt } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Signed URL generation failed";
    return { ok: false, error: { code: "SIGNED_URL_FAILED", message } };
  }
}

// ─── Download (server-side proxy source) ─────────────────────────────────────

export type AttachmentDownloadSource = {
  /** Server-fetchable Cloudinary URL for the original asset bytes. */
  url: string;
  /** Original (sanitized) filename to present to the user. */
  fileName: string;
  /** Best-known content type for the response. */
  contentType: string;
};

/**
 * Resolve the upstream Cloudinary URL to stream a receipt download from.
 *
 * We use Cloudinary's signed download API (`private_download_url`) rather than a
 * res.cloudinary.com delivery URL because the download API serves the *original*
 * asset for every type — including PDFs, whose inline delivery is blocked by
 * Cloudinary's default media-type restriction (HTTP 401/404).
 *
 * The returned URL is fetched server-side by the route handler, which then
 * streams the bytes to the client with the original filename. This keeps the
 * Cloudinary URL off the client and lets us control the download filename
 * (the download API itself only yields a generic "file.<ext>" name).
 */
export async function getAttachmentDownloadSourceService(
  attachmentId: string,
  actorUserId: string,
): Promise<ServiceResult<AttachmentDownloadSource>> {
  try {
    const attachment = await attachmentRepository.findById(prisma, attachmentId);
    if (!attachment) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Attachment not found" } };
    }

    const expense = await expenseRepository.findActiveById(
      prisma,
      attachment.expenseId,
    );
    if (!expense) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Related expense not found or deleted" },
      };
    }

    if (attachment.provider !== "CLOUDINARY" || !attachment.cloudinaryPublicId) {
      return {
        ok: false,
        error: {
          code: "UNSUPPORTED_PROVIDER",
          message: "Download is only supported for Cloudinary assets",
        },
      };
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
    const resourceType = cloudinaryResourceType(
      attachment.contentType,
      attachment.cloudinaryFormat,
    );

    const url = cloudinary.utils.private_download_url(
      attachment.cloudinaryPublicId,
      cloudinaryFormatFor(attachment, resourceType),
      {
        resource_type: resourceType,
        type: "authenticated",
        expires_at: expiresAt,
        attachment: true,
      },
    );

    logAttachmentAccess({
      attachmentId,
      expenseId: attachment.expenseId,
      userId: actorUserId,
      expiresAt,
    });

    return {
      ok: true,
      data: {
        url,
        fileName: attachment.fileName,
        contentType: attachment.contentType || "application/octet-stream",
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Download URL generation failed";
    return { ok: false, error: { code: "DOWNLOAD_FAILED", message } };
  }
}
