import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireExpenseWriter } from "@/lib/api/auth-guard";
import { deleteAttachmentService } from "@/features/attachments/application/attachment.service";

export const runtime = "nodejs";

const idSchema = z.string().trim().min(1).max(128);

/** DELETE /api/expenses/:id/attachments/:attachmentId */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const auth = await requireExpenseWriter();
  if (!auth.ok) return auth.response;

  const { id: rawExpenseId, attachmentId: rawAttachmentId } = await ctx.params;

  const expenseIdParsed = idSchema.safeParse(rawExpenseId);
  const attachmentIdParsed = idSchema.safeParse(rawAttachmentId);

  if (!expenseIdParsed.success || !attachmentIdParsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid id" } },
      { status: 400 },
    );
  }

  const result = await deleteAttachmentService(
    attachmentIdParsed.data,
    auth.userId,
  );

  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
