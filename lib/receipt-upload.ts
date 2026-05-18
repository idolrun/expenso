/** Max allowed receipt upload size in bytes (3 MB). */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** MIME types accepted for receipt attachments. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/csv",
] as const;
