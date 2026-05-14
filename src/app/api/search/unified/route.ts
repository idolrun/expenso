import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { parseUserRole } from "@/lib/auth/session";
import { unifiedSearch } from "@/features/search/application/unified-search.service";
import { globalSearchQuerySchema } from "@/features/expenses/validation/expense";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = globalSearchQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join("; "),
        },
      },
      { status: 400 },
    );
  }

  const result = await unifiedSearch(parsed.data, role);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
