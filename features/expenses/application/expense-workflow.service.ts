import { AuditAction, ExpenseStatus, Prisma, UserRole } from "@/generated/prisma/client";
import type {
  ApproveExpenseInput,
  CancelExpenseInput,
  PayExpenseInput,
  RejectExpenseInput,
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
      error: { code: "INVALID_TRANSITION", message: "Only DRAFT expenses can be submitted for approval" },
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

export async function approveExpenseService(
  input: ApproveExpenseInput,
  actorUserId: string,
  actorRole: UserRole,
): Promise<ServiceResult<{ id: string }>> {
  const expense = await expenseRepository.findActiveById(prisma, input.id);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  if (expense.status !== ExpenseStatus.SUBMITTED) {
    return {
      ok: false,
      error: { code: "INVALID_TRANSITION", message: "Only SUBMITTED expenses can be approved" },
    };
  }

  // Self-approval guard: submitters cannot approve their own unless they are ADMIN
  if (expense.submittedById === actorUserId && actorRole !== UserRole.ADMIN) {
    return {
      ok: false,
      error: { code: "SELF_APPROVAL", message: "You cannot approve your own submission" },
    };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await expenseRepository.update(tx, input.id, {
      status: ExpenseStatus.APPROVED,
      approvedAt: now,
      approvedBy: { connect: { id: actorUserId } },
      approvalComment: input.comment ?? undefined,
      updatedBy: { connect: { id: actorUserId } },
    });

    await auditLogRepository.create(tx, {
      action: AuditAction.EXPENSE_APPROVED,
      entityType: "Expense",
      entityId: input.id,
      actor: { connect: { id: actorUserId } },
      metadata: { comment: input.comment ?? null },
    });
  });

  return { ok: true, data: { id: input.id } };
}

export async function rejectExpenseService(
  input: RejectExpenseInput,
  actorUserId: string,
  actorRole: UserRole,
): Promise<ServiceResult<{ id: string }>> {
  const expense = await expenseRepository.findActiveById(prisma, input.id);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  if (expense.status !== ExpenseStatus.SUBMITTED) {
    return {
      ok: false,
      error: { code: "INVALID_TRANSITION", message: "Only SUBMITTED expenses can be rejected" },
    };
  }

  // Self-rejection guard: submitters cannot reject their own unless they are ADMIN
  if (expense.submittedById === actorUserId && actorRole !== UserRole.ADMIN) {
    return {
      ok: false,
      error: { code: "SELF_REJECTION", message: "You cannot reject your own submission" },
    };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await expenseRepository.update(tx, input.id, {
      status: ExpenseStatus.REJECTED,
      rejectedAt: now,
      rejectedBy: { connect: { id: actorUserId } },
      approvalComment: input.comment ?? undefined,
      updatedBy: { connect: { id: actorUserId } },
    });

    await auditLogRepository.create(tx, {
      action: AuditAction.EXPENSE_REJECTED,
      entityType: "Expense",
      entityId: input.id,
      actor: { connect: { id: actorUserId } },
      metadata: { comment: input.comment ?? null },
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

  if (expense.status !== ExpenseStatus.APPROVED) {
    return {
      ok: false,
      error: { code: "INVALID_TRANSITION", message: "Only APPROVED expenses can be marked as paid" },
    };
  }

  const now = new Date();

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
  actorRole: UserRole,
): Promise<ServiceResult<{ id: string }>> {
  const expense = await expenseRepository.findActiveById(prisma, input.id);
  if (!expense) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
  }

  const cancellableStatuses: ExpenseStatus[] = [ExpenseStatus.DRAFT, ExpenseStatus.SUBMITTED, ExpenseStatus.REJECTED];
  if (!cancellableStatuses.includes(expense.status)) {
    return {
      ok: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `Cannot cancel an expense with status ${expense.status}`,
      },
    };
  }

  // Only admin or the creator can cancel
  if (actorRole !== UserRole.ADMIN && expense.createdById !== actorUserId) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Only the creator or an admin can cancel this expense" },
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
