import { NextResponse } from "next/server";

import { requireExpenseReader } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireExpenseReader();
  if (!auth.ok) {
    return auth.response;
  }

  const rows = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, color: true },
  });

  return NextResponse.json({ ok: true, data: rows });
}
