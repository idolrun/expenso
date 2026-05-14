import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireExpenseWriter } from "@/lib/api/auth-guard";
import { archiveAttachmentService } from "@/features/attachments/application/attachment.service";

export const runtime = "nodejs";

const idSchema = z.string().trim().min(1).max(128);

/**
 * @deprecated DELETE is no longer supported. Use PATCH to archive attachments.
 * Returns 405 Method Not Allowed.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; attachmentId: string }> },
) {
  void ctx; // acknowledge parameter to satisfy linter
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "DELETE is not supported. Use PATCH to archive attachments.",
      },
    },
    { status: 405 },
  );
}

/** PATCH /api/expenses/:id/attachments/:attachmentId — archive an attachment */
export async function PATCH(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const auth = await requireExpenseWriter();
  if (!auth.ok) return auth.response;

  const { attachmentId: rawAttachmentId } = await ctx.params;

  const attachmentIdParsed = idSchema.safeParse(rawAttachmentId);

  if (!attachmentIdParsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid attachment id" } },
      { status: 400 },
    );
  }

  const result = await archiveAttachmentService(
    attachmentIdParsed.data,
    auth.userId,
  );

  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
