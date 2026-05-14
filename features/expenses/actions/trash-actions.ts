"use server";

import { revalidatePath } from "next/cache";
import { Prisma, AuditAction, UserRole } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth/guards";
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

export async function listDeletedExpensesAction(): Promise<TrashActionResult<TrashExpenseItem[]>> {
  const { session } = await requireRole([UserRole.ADMIN]);
  const userId = session.session.userId;

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
  const { session } = await requireRole([UserRole.ADMIN]);
  const userId = session.session.userId;

  const existing = await prisma.expense.findFirst({
    where: { id, deletedAt: { not: null } },
  });

  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Deleted expense not found" } };
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

export async function purgeExpenseAction(id: string): Promise<TrashActionResult<{ id: string }>> {
  const { session } = await requireRole([UserRole.ADMIN]);
  const userId = session.session.userId;

  const existing = await prisma.expense.findFirst({
    where: { id, deletedAt: { not: null } },
  });

  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Deleted expense not found" } };
  }

  await prisma.$transaction(async (tx) => {
    // Delete related records first
    await tx.attachment.deleteMany({ where: { expenseId: id } });
    await tx.expenseHistory.deleteMany({ where: { expenseId: id } });
    await tx.expenseTag.deleteMany({ where: { expenseId: id } });
    await tx.salaryRecord.deleteMany({ where: { expenseId: id } });

    // Hard delete the expense
    await tx.expense.delete({ where: { id } });

    await auditLogRepository.create(tx, {
      action: AuditAction.OTHER,
      entityType: "Expense",
      entityId: id,
      actor: { connect: { id: userId } },
      metadata: { action: "HARD_DELETED", title: existing.title },
    });
  });

  revalidatePath("/dashboard/trash");

  return { ok: true, data: { id } };
}
