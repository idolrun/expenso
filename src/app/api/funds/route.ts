import { NextRequest, NextResponse } from "next/server";

import { fundService } from "@/features/funds/application/fund.service";
import {
  createFundEntrySchema,
  fundListQuerySchema,
} from "@/features/funds/validation/fund";
import { requireFundReader } from "@/lib/api/auth-guard";

function parseFundListQuery(searchParams: URLSearchParams) {
  return fundListQuerySchema.safeParse({
    createdById: searchParams.get("createdById") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    currency: searchParams.get("currency") ?? undefined,
    amountMin: searchParams.get("amountMin") ?? undefined,
    amountMax: searchParams.get("amountMax") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireFundReader(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseFundListQuery(request.nextUrl.searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const { entries, total } = await fundService.list(parsed.data);
    return NextResponse.json({
      ok: true,
      data: entries,
      total,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch fund entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireFundReader(request);
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body",
        },
      },
      { status: 400 },
    );
  }

  const validated = createFundEntrySchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          issues: validated.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const entry = await fundService.create(
      validated.data,
      auth.session.user.id,
    );
    return NextResponse.json({ ok: true, data: entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create fund entry" },
      { status: 500 },
    );
  }
}
