import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { getAttachmentDownloadSourceService } from "@/features/attachments/application/attachment.service";

export const runtime = "nodejs";

const idSchema = z.string().trim().min(1).max(128);

/** Build a safe RFC 5987 Content-Disposition value for the filename. */
function contentDisposition(fileName: string): string {
  // ASCII fallback: strip anything outside a conservative printable range.
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`;
}

/**
 * GET /api/attachments/:id/download
 *
 * Streams the original receipt file as a forced download, proxied through the
 * server so we control the filename and never expose Cloudinary URLs.
 *
 * Why proxy instead of redirecting to a Cloudinary URL:
 *   - PDFs cannot be delivered inline from res.cloudinary.com (Cloudinary's
 *     default media-type restriction returns 401/404). The signed download API
 *     does serve them, but only with a generic "file.<ext>" filename.
 *   - Proxying lets us stream the bytes with the original filename and the
 *     correct content type while keeping the request behind our session auth.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const { id: rawId } = await ctx.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid attachment id" } },
      { status: 400 },
    );
  }

  const result = await getAttachmentDownloadSourceService(idParsed.data, auth.userId);
  if (!result.ok) {
    const status =
      result.error.code === "NOT_FOUND"
        ? 404
        : result.error.code === "UNSUPPORTED_PROVIDER"
          ? 422
          : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  const upstream = await fetch(result.data.url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DOWNLOAD_FAILED", message: "Failed to fetch the attachment" },
      },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": contentDisposition(result.data.fileName),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
