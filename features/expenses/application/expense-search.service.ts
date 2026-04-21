import type { Prisma } from "@/app/generated/prisma/client";

import type { GlobalSearchQuery } from "@/features/expenses/validation/expense";
import type { GlobalSearchHitDto, ServiceResult } from "@/features/expenses/domain/dto";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { prisma } from "@/lib/prisma";
import { serializeSearchHit } from "@/features/expenses/domain/serialize";
import type { ExpenseWithListRelations } from "@/features/expenses/infrastructure/expense-include";

function detectMatch(row: ExpenseWithListRelations, q: string): GlobalSearchHitDto["matchedOn"] {
  const needle = q.toLowerCase();
  if (row.title.toLowerCase().includes(needle)) return "title";
  if (row.notes?.toLowerCase().includes(needle)) return "notes";
  if (row.category?.name?.toLowerCase().includes(needle)) return "category";
  for (const et of row.expenseTags) {
    if (
      et.tag.name.toLowerCase().includes(needle) ||
      et.tag.slug.toLowerCase().includes(needle)
    ) {
      return "tag";
    }
  }
  return "title";
}

export async function globalSearchExpenses(
  query: GlobalSearchQuery,
): Promise<ServiceResult<GlobalSearchHitDto[]>> {
  try {
    const q = query.q.trim();
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        {
          category: {
            name: { contains: q, mode: "insensitive" },
          },
        },
        {
          expenseTags: {
            some: {
              tag: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { slug: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ],
    };

    const rows = await expenseRepository.findManySearch(prisma, {
      where,
      take: query.limit,
    });

    return {
      ok: true,
      data: rows.map((row) => serializeSearchHit(row, detectMatch(row, q))),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return { ok: false, error: { code: "SEARCH_FAILED", message } };
  }
}
