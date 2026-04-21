import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { expenseSectionValues } from "@/features/expenses/validation/primitives";
import { requireExpenseReader } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  section: z.enum(expenseSectionValues).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
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

  const rows = await prisma.category.findMany({
    where: {
      isActive: true,
      ...(parsed.data.section ? { section: parsed.data.section } : {}),
    },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, section: true },
  });

  return NextResponse.json({ ok: true, data: rows });
}
