import { Prisma } from "@/generated/prisma/client";

import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type {
  ExpenseDto,
  ExpenseHistoryWithExpenseDto,
  PaginatedDto,
} from "@/features/expenses/domain/dto";
import {
  serializeExpense,
  serializeExpenseHistoryRow,
} from "@/features/expenses/domain/serialize";
import { expenseHistoryRepository } from "@/features/expenses/infrastructure/expense-history.repository";

function parseYmdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function userLabel(
  user: { name: string | null; email: string } | null | undefined,
  fallbackId: string,
): string {
  return user?.name?.trim() || user?.email || `user ${fallbackId.slice(0, 8)}…`;
}

export function buildExpenseListWhere(
  query: ListExpensesQuery,
): Prisma.ExpenseWhereInput {
  const andParts: Prisma.ExpenseWhereInput[] = [{ deletedAt: null }];

  if (query.section) {
    andParts.push({ section: query.section });
  }
  if (query.status) {
    andParts.push({ status: query.status });
  }
  if (query.paymentType) {
    andParts.push({ paymentType: query.paymentType });
  }
  if (query.createdByEmail) {
    andParts.push({
      createdBy: {
        email: { contains: query.createdByEmail, mode: "insensitive" },
      },
    });
  }
  if (query.updatedByEmail) {
    andParts.push({
      updatedBy: {
        email: { contains: query.updatedByEmail, mode: "insensitive" },
      },
    });
  }

  if (query.tagIds.length) {
    andParts.push({
      expenseTags: { some: { tagId: { in: query.tagIds } } },
    });
  }

  if (query.amountMin || query.amountMax) {
    const range: Prisma.DecimalFilter = {};
    if (query.amountMin) {
      range.gte = new Prisma.Decimal(query.amountMin);
    }
    if (query.amountMax) {
      range.lte = new Prisma.Decimal(query.amountMax);
    }
    andParts.push({ originalAmount: range });
  }

  if (query.dateRangeStart || query.dateRangeEnd) {
    if (query.dateRangeStart) {
      andParts.push({
        fromDate: { gte: parseYmdToUtcDate(query.dateRangeStart) },
      });
    }
    if (query.dateRangeEnd) {
      andParts.push({ toDate: { lte: parseYmdToUtcDate(query.dateRangeEnd) } });
    }
  }

  const q = query.search?.trim();
  if (q) {
    andParts.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
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
    });
  }

  return { AND: andParts };
}

function buildOrderBy(
  query: ListExpensesQuery,
): Prisma.ExpenseOrderByWithRelationInput[] {
  const dir = query.sortDir;
  switch (query.sortField) {
    case "amount":
      return [{ originalAmount: dir }];
    case "fromDate":
      return [{ fromDate: dir }];
    case "title":
      return [{ title: dir }];
    case "updatedAt":
      return [{ updatedAt: dir }];
    case "createdAt":
    default:
      return [{ createdAt: dir }];
  }
}

export async function listExpenseHistoryForExpense(
  expenseId: string,
): Promise<ServiceResult<ExpenseHistoryWithExpenseDto[]>> {
  try {
    const rows = await expenseHistoryRepository.findForExpense(
      prisma,
      expenseId,
    );
    const data: ExpenseHistoryWithExpenseDto[] = rows.map((r) => ({
      ...serializeExpenseHistoryRow({
        id: r.id,
        expenseId: r.expenseId,
        batchId: r.batchId,
        fieldKey: r.fieldKey,
        oldValue: r.oldValue,
        newValue: r.newValue,
        changedById: r.changedById,
        createdAt: r.createdAt,
      }),
      changedByLabel: userLabel(r.changedBy, r.changedById),
      expenseTitle: r.expense.title,
      expenseSection: r.expense.section,
    }));
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "History load failed";
    return { ok: false, error: { code: "HISTORY_LOAD_FAILED", message } };
  }
}

export async function getExpenseById(
  id: string,
): Promise<ServiceResult<ExpenseDto>> {
  try {
    const row = await expenseRepository.findActiveById(prisma, id);
    if (!row) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Expense not found" },
      };
    }
    return { ok: true, data: serializeExpense(row) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Load failed";
    return { ok: false, error: { code: "LOAD_FAILED", message } };
  }
}

export async function listExpenses(
  query: ListExpensesQuery,
): Promise<ServiceResult<PaginatedDto<ExpenseDto>>> {
  try {
    const where = buildExpenseListWhere(query);
    const orderBy = buildOrderBy(query);
    const skip = (query.page - 1) * query.pageSize;

    const [total, rows] = await Promise.all([
      expenseRepository.countWhere(prisma, where),
      expenseRepository.findManyWhere(prisma, {
        where,
        orderBy,
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      ok: true,
      data: {
        items: rows.map(serializeExpense),
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "List failed";
    return { ok: false, error: { code: "LIST_FAILED", message } };
  }
}
