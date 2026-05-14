"use server";

import { revalidatePath } from "next/cache";
import { AuditAction, ExpenseStatus, UserRole } from "@/generated/prisma/client";
import { getSession, parseUserRole } from "@/lib/auth/session";
import { sessionToUserId } from "@/lib/auth/actor";
import { prisma } from "@/lib/prisma";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import type { ServiceResult } from "@/features/expenses/domain/dto";

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: { code: string; message: string } }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } };
  }
  const role = parseUserRole(session.user.role);
  if (role !== UserRole.ADMIN) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Admin only" } };
  }
  return { ok: true, userId: sessionToUserId(session) };
}

export async function bulkDeleteExpensesAction(
  ids: string[],
): Promise<ServiceResult<{ deletedCount: number }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!ids.length) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "No items selected" } };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.expense.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: now, updatedById: auth.userId },
    });

    for (const id of ids) {
      await auditLogRepository.create(tx, {
        action: AuditAction.EXPENSE_SOFT_DELETED,
        entityType: "Expense",
        entityId: id,
        actor: { connect: { id: auth.userId } },
        metadata: { bulk: true, count: ids.length },
      });
    }
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");

  return { ok: true, data: { deletedCount: ids.length } };
}

export async function bulkPayExpensesAction(
  ids: string[],
): Promise<ServiceResult<{ paidCount: number }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!ids.length) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "No items selected" } };
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.updateMany({
      where: {
        id: { in: ids },
        status: ExpenseStatus.APPROVED,
        deletedAt: null,
      },
      data: { status: ExpenseStatus.PAID, updatedById: auth.userId },
    });

    for (const id of ids) {
      await auditLogRepository.create(tx, {
        action: AuditAction.EXPENSE_PAID,
        entityType: "Expense",
        entityId: id,
        actor: { connect: { id: auth.userId } },
        metadata: { bulk: true, count: ids.length },
      });
    }
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");

  return { ok: true, data: { paidCount: ids.length } };
}
