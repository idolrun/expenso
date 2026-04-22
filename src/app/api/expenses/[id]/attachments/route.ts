import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireExpenseWriter, requireExpenseReader } from "@/lib/api/auth-guard";
import {
  uploadAttachmentService,
  listAttachmentsService,
} from "@/features/attachments/application/attachment.service";

export const runtime = "nodejs";

const idParamSchema = z.string().trim().min(1).max(128);

async function resolveId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = idParamSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}

/** GET /api/expenses/:id/attachments — list attachments for an expense */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireExpenseReader();
  if (!auth.ok) return auth.response;

  const expenseId = await resolveId(ctx);
  if (!expenseId) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid id" } },
      { status: 400 },
    );
  }

  const result = await listAttachmentsService(expenseId);
  if (!result.ok) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data });
}

/** POST /api/expenses/:id/attachments — upload a receipt file */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireExpenseWriter();
  if (!auth.ok) return auth.response;

  const expenseId = await resolveId(ctx);
  if (!expenseId) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid id" } },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request must be multipart/form-data",
        },
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Field 'file' must be a file upload" },
      },
      { status: 400 },
    );
  }

  const result = await uploadAttachmentService(expenseId, file, auth.userId);
  if (!result.ok) {
    const status =
      result.error.code === "NOT_FOUND"
        ? 404
        : result.error.code === "VALIDATION_ERROR"
          ? 422
          : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
}
