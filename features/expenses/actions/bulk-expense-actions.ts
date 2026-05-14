"use server";

import { revalidatePath } from "next/cache";
import { AuditAction, ExpenseStatus } from "@/generated/prisma/client";
import { getSession, parseUserRole } from "@/lib/auth/session";
import { sessionToUserId } from "@/lib/auth/actor";
import { hasPermission, Permission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import type { ServiceResult } from "@/features/expenses/domain/dto";

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

export async function bulkArchiveExpensesAction(
  ids: string[],
): Promise<ServiceResult<{ archivedCount: number }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const role = parseUserRole(auth.session.user.role);
  if (!hasPermission(role, Permission.CAN_BULK_ARCHIVE_EXPENSE)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } };
  }

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
        action: AuditAction.EXPENSE_ARCHIVED,
        entityType: "Expense",
        entityId: id,
        actor: { connect: { id: auth.userId } },
        metadata: { bulk: true, count: ids.length },
      });
    }
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");

  return { ok: true, data: { archivedCount: ids.length } };
}

export async function bulkPayExpensesAction(
  ids: string[],
): Promise<ServiceResult<{ paidCount: number }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const role = parseUserRole(auth.session.user.role);
  if (!hasPermission(role, Permission.CAN_BULK_PAY_EXPENSE)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } };
  }

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
