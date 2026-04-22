import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { getSignedAttachmentUrlService } from "@/features/attachments/application/attachment.service";

export const runtime = "nodejs";

const idSchema = z.string().trim().min(1).max(128);

/**
 * GET /api/attachments/:id/view
 *
 * Returns a short-lived (60 s) Cloudinary signed URL for a private receipt.
 *
 * Security:
 *   - Requires an active authenticated session (any role).
 *   - The service layer re-verifies that the parent expense is not deleted
 *     (defense in depth — the attachment cannot be served after its expense
 *     is soft-deleted even if the attachment row still exists).
 *   - The signed URL expires after 60 s; Cloudinary rejects it after that
 *     window regardless of where the URL ends up.
 *   - Raw Cloudinary public_ids or permanent URLs are never returned.
 *   - Response is marked no-store to prevent caching of signed URLs.
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

  const result = await getSignedAttachmentUrlService(idParsed.data, auth.userId);

  if (!result.ok) {
    const status =
      result.error.code === "NOT_FOUND"
        ? 404
        : result.error.code === "UNSUPPORTED_PROVIDER"
          ? 422
          : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json(
    { ok: true, data: result.data },
    {
      headers: {
        // Never cache signed URLs — they contain time-limited credentials.
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        // Prevent MIME-type sniffing on the JSON response.
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
