import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/receipt-upload";

// ─── Extension ↔ MIME mapping ──────────────────────────────────────────────
// Used to detect MIME spoofing — e.g., an executable renamed to .jpg.
// Validation fails only when BOTH a known MIME and a mismatching extension are
// present; it succeeds when the extension is absent (server-side content-type
// detection handles it) or when the mapping is unknown.
const EXTENSIONS_BY_MIME: Readonly<Record<string, readonly string[]>> = {
  "image/jpeg": [".jpg", ".jpeg", ".jpe"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
};

/** Browser-reported types that are normalized to `text/csv` when the extension is `.csv`. */
const CSV_INFERABLE_MIMES = new Set([
  "",
  "application/octet-stream",
  "application/vnd.ms-excel",
  "text/plain",
]);

export const RECEIPT_UPLOAD_ACCEPT = ".pdf,.png,.jpg,.jpeg,.csv";

export const RECEIPT_UPLOAD_TYPES_LABEL = "PNG, JPEG, PDF, CSV";

// ─── Error types ────────────────────────────────────────────────────────────

export type AttachmentValidationError =
  | { code: "MISSING_FILE" }
  | { code: "FILE_TOO_LARGE"; maxBytes: number; actualBytes: number }
  | { code: "UNSUPPORTED_TYPE"; contentType: string }
  | {
      code: "EXTENSION_MISMATCH";
      /** Lowercase extension with leading dot, e.g. ".exe" */
      extension: string;
      /** The declared MIME type. */
      contentType: string;
    };

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sanitize a user-supplied filename before storing it in the database or
 * returning it in API responses.
 *
 * - Strips path separators to prevent path-traversal attacks.
 * - Strips characters that are unsafe in Content-Disposition headers.
 * - Truncates to 255 bytes (UTF-8) to match most filesystem limits.
 * - Falls back to "attachment" for completely empty / invalid names.
 */
export function sanitizeFilename(rawName: string): string {
  // Drop any path prefix that might be included (Windows or Unix).
  const base = rawName.split(/[/\\]/).at(-1) ?? rawName;
  // Allow word chars (\w), spaces, dots, dashes, underscores, parens, brackets.
  // Replace everything else with an underscore.
  const safe = base.replace(/[^\w\s.\-()[\]]/gu, "_").trim();
  // Fall back to "attachment" when the cleaned name has no alphanumeric content
  // (e.g., a name consisting entirely of emojis replaced by underscores).
  const hasAlphanumeric = /[a-zA-Z0-9]/.test(safe);
  const result = hasAlphanumeric ? safe : "attachment";
  // Trim to 255 code-points (safe for most filesystems and DB varchar(255)).
  return [...result].slice(0, 255).join("");
}

/**
 * Return the lowercase extension (with leading dot) from a filename,
 * or an empty string when no extension is present.
 */
function fileExtension(name: string): string {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

/**
 * Resolve the effective MIME type for receipt validation.
 * Browsers often omit or mislabel CSV uploads (e.g. `application/vnd.ms-excel`).
 */
export function resolveReceiptContentType(file: {
  name: string;
  type: string;
}): string {
  const ext = fileExtension(file.name);
  if (ext === ".csv" && CSV_INFERABLE_MIMES.has(file.type)) {
    return "text/csv";
  }
  return file.type;
}

// ─── Primary validator ───────────────────────────────────────────────────────

/**
 * Validate a Web API File object for receipt upload.
 *
 * Checks (in order):
 *   1. File present and non-empty.
 *   2. Size within MAX_UPLOAD_BYTES.
 *   3. MIME type in the allow-list.
 *   4. File extension consistent with the declared MIME type (anti-spoofing).
 *
 * Returns null on success, or a typed error descriptor on failure.
 */
export function validateReceiptFile(
  file: File | null | undefined,
): AttachmentValidationError | null {
  if (!file || file.size === 0) {
    return { code: "MISSING_FILE" };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      maxBytes: MAX_UPLOAD_BYTES,
      actualBytes: file.size,
    };
  }

  const contentType = resolveReceiptContentType(file);

  if (
    !ALLOWED_MIME_TYPES.includes(
      contentType as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return {
      code: "UNSUPPORTED_TYPE",
      contentType: file.type || contentType,
    };
  }

  // Extension ↔ MIME check — only enforced when:
  //   - An extension is present on the filename, AND
  //   - The MIME type maps to a known extension set.
  const ext = fileExtension(file.name);
  const allowedExts = EXTENSIONS_BY_MIME[contentType];
  if (ext && allowedExts && !allowedExts.includes(ext)) {
    return { code: "EXTENSION_MISMATCH", extension: ext, contentType };
  }

  return null;
}

// ─── User-facing message ─────────────────────────────────────────────────────

export function attachmentValidationMessage(
  err: AttachmentValidationError,
): string {
  switch (err.code) {
    case "MISSING_FILE":
      return "No file provided";
    case "FILE_TOO_LARGE":
      return `File exceeds the maximum allowed size of ${Math.round(err.maxBytes / (1024 * 1024))} MB`;
    case "UNSUPPORTED_TYPE":
      return `Unsupported file type${err.contentType ? ` (${err.contentType})` : ""}. Allowed: ${RECEIPT_UPLOAD_TYPES_LABEL}`;
    case "EXTENSION_MISMATCH":
      return `File extension "${err.extension}" does not match the declared type (${err.contentType}). Please verify the file is not renamed`;
  }
}
