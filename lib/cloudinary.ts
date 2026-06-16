import { v2 as cloudinary } from "cloudinary";

export { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/receipt-upload";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/** Cloudinary formats that are stored under the `image` resource type. */
const CLOUDINARY_IMAGE_FORMATS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "heic",
  "heif",
  // PDFs are uploaded with resource_type "auto" and Cloudinary stores them as
  // `image` resources (so it can render/transform individual pages). They are
  // NOT raw assets — delivering them under `raw/...` yields a 404.
  "pdf",
]);

/**
 * Determine the Cloudinary resource_type for an already-uploaded attachment.
 *
 * This must match how Cloudinary actually stored the asset (uploads use
 * resource_type "auto"). Critically, PDFs are stored as `image`, not `raw`.
 * We consult the detected format first (most reliable), then fall back to the
 * MIME type.
 */
export function cloudinaryResourceType(
  mimeType: string | null,
  format?: string | null,
): "image" | "raw" | "video" {
  const fmt = format?.toLowerCase().replace(/^\./, "") ?? null;
  if (fmt && CLOUDINARY_IMAGE_FORMATS.has(fmt)) return "image";

  const mime = mimeType?.toLowerCase() ?? null;
  if (!mime) return fmt ? "raw" : "image";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw"; // CSV, docx, etc.
}


