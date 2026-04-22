import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Determine the Cloudinary resource_type from a MIME type string.
 * Required for correct signed URL and delete operations.
 */
export function cloudinaryResourceType(
  mimeType: string | null,
): "image" | "raw" | "video" {
  if (!mimeType) return "image";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw"; // PDF, docx, etc.
}

/** Max allowed upload size in bytes (3 MB). */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** MIME types accepted for receipt attachments. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
