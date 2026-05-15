import { AuditAction, ExpenseStatus, Prisma, UserRole } from "@/generated/prisma/client";
import type {
  CancelExpenseInput,
  PayExpenseInput,
  SubmitForApprovalInput,
} from "@/features/expenses/validation/workflow";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { prisma } from "@/lib/prisma";

export async function submitForApprovalService(
  input: SubmitForApprovalInput,
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  const expense = await expenseRepository.findActiveById(prisma, input.id);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  if (expense.status !== ExpenseStatus.DRAFT) {
    return {
      ok: false,
      error: { code: "INVALID_TRANSITION", message: "Only DRAFT expenses can be submitted" },
    };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await expenseRepository.update(tx, input.id, {
      status: ExpenseStatus.SUBMITTED,
      submittedAt: now,
      submittedBy: { connect: { id: actorUserId } },
      updatedBy: { connect: { id: actorUserId } },
    });

    await auditLogRepository.create(tx, {
      action: AuditAction.EXPENSE_SUBMITTED,
      entityType: "Expense",
      entityId: input.id,
      actor: { connect: { id: actorUserId } },
      metadata: { previousStatus: expense.status },
    });
  });

  return { ok: true, data: { id: input.id } };
}

export async function payExpenseService(
  input: PayExpenseInput,
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  const expense = await expenseRepository.findActiveById(prisma, input.id);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  if (expense.status !== ExpenseStatus.SUBMITTED) {
    return {
      ok: false,
      error: { code: "INVALID_TRANSITION", message: "Only SUBMITTED expenses can be marked as paid" },
    };
  }

  await prisma.$transaction(async (tx) => {
    await expenseRepository.update(tx, input.id, {
      status: ExpenseStatus.PAID,
      updatedBy: { connect: { id: actorUserId } },
    });

    await auditLogRepository.create(tx, {
      action: AuditAction.EXPENSE_PAID,
      entityType: "Expense",
      entityId: input.id,
      actor: { connect: { id: actorUserId } },
      metadata: {},
    });
  });

  return { ok: true, data: { id: input.id } };
}

export async function cancelExpenseService(
  input: CancelExpenseInput,
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  const expense = await expenseRepository.findActiveById(prisma, input.id);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  const cancellableStatuses: ExpenseStatus[] = [ExpenseStatus.DRAFT, ExpenseStatus.SUBMITTED];
  if (!cancellableStatuses.includes(expense.status)) {
    return {
      ok: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `Cannot cancel an expense with status ${expense.status}`,
      },
    };
  }

  // Only creator can cancel
  if (expense.createdById !== actorUserId) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Only the creator can cancel this expense" },
    };
  }

  await prisma.$transaction(async (tx) => {
    await expenseRepository.update(tx, input.id, {
      status: ExpenseStatus.CANCELLED,
      updatedBy: { connect: { id: actorUserId } },
    });

    await auditLogRepository.create(tx, {
      action: AuditAction.EXPENSE_CANCELLED,
      entityType: "Expense",
      entityId: input.id,
      actor: { connect: { id: actorUserId } },
      metadata: { previousStatus: expense.status },
    });
  });

  return { ok: true, data: { id: input.id } };
}
