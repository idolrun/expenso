"use server";

import { revalidatePath } from "next/cache";
import { Prisma, AuditAction } from "@/generated/prisma/client";
import { getSession, parseUserRole } from "@/lib/auth/session";
import { sessionToUserId } from "@/lib/auth/actor";
import { prisma } from "@/lib/prisma";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { expenseHistoryRepository } from "@/features/expenses/infrastructure/expense-history.repository";
import { randomUUID } from "crypto";

export type TrashExpenseItem = {
  id: string;
  title: string;
  section: string;
  status: string;
  originalAmount: string;
  originalCurrency: string;
  deletedAt: string | null;
  createdByLabel: string;
};

export type TrashActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function requireSessionUser() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    };
  }
  return { ok: true as const, session, userId: sessionToUserId(session) };
}

export async function listArchivedExpensesAction(): Promise<TrashActionResult<TrashExpenseItem[]>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const rows = await prisma.expense.findMany({
    where: { deletedAt: { not: null } },
    include: {
      createdBy: { select: { name: true, email: true } },
      updatedBy: { select: { name: true, email: true } },
    },
    orderBy: { deletedAt: "desc" },
    take: 100,
  });

  return {
    ok: true,
    data: rows.map((row) => ({
      id: row.id,
      title: row.title,
      section: row.section,
      status: row.status,
      originalAmount: row.originalAmount.toString(),
      originalCurrency: row.originalCurrency,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdByLabel: row.createdBy?.name?.trim() || row.createdBy?.email || "Unknown",
    })),
  };
}

export async function restoreExpenseAction(id: string): Promise<TrashActionResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const userId = auth.userId;

  const existing = await prisma.expense.findFirst({
    where: { id, deletedAt: { not: null } },
  });

  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Archived expense not found" } };
  }

  const batchId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id },
      data: { deletedAt: null, updatedById: userId },
    });

    await expenseHistoryRepository.createMany(tx, [
      {
        expenseId: id,
        batchId,
        fieldKey: "deletedAt",
        oldValue: existing.deletedAt?.toISOString() ?? Prisma.JsonNull,
        newValue: Prisma.JsonNull,
        changedById: userId,
      },
    ]);

    await auditLogRepository.create(tx, {
      action: AuditAction.EXPENSE_RESTORED,
      entityType: "Expense",
      entityId: id,
      actor: { connect: { id: userId } },
      metadata: { batchId },
    });
  });

  revalidatePath("/dashboard/trash");
  revalidatePath("/dashboard/expenses");

  return { ok: true, data: { id } };
}

/**
 * @deprecated Hard delete is no longer supported. Use archive/restore instead.
 * This function now returns a 405-style error.
 */
export async function purgeExpenseAction(_id: string): Promise<TrashActionResult<{ id: string }>> {
  return {
    ok: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Permanent deletion is not supported. Use archive/restore instead.",
    },
  };
}
