import { randomUUID } from "node:crypto";

import {
  AuditAction,
  Prisma,
  UserRole,
} from "@/app/generated/prisma/client";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/features/expenses/validation/expense";
import type { DeleteExpenseInput } from "@/features/expenses/validation/expense";
import type { ExpenseDto, ServiceResult } from "@/features/expenses/domain/dto";
import {
  buildExpenseHistoryRows,
  expenseRowToSnapshot,
  type ExpenseScalarSnapshot,
} from "@/features/expenses/application/expense-history.builder";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { expenseHistoryRepository } from "@/features/expenses/infrastructure/expense-history.repository";
import { expenseRepository } from "@/features/expenses/infrastructure/expense.repository";
import { serializeExpense } from "@/features/expenses/domain/serialize";
import { userRepository } from "@/features/users/infrastructure/user.repository";
import { prisma } from "@/lib/prisma";

function parseYmdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function snapshotsEqual(a: ExpenseScalarSnapshot, b: ExpenseScalarSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function createExpenseService(
  input: CreateExpenseInput,
  actorUserId: number,
): Promise<ServiceResult<ExpenseDto>> {
  try {
    await expenseRepository.assertCategoryExists(prisma, input.categoryId ?? null);
    await expenseRepository.assertTagsExist(prisma, input.tagIds);

    const expense = await prisma.$transaction(async (tx) => {
      const created = await expenseRepository.create(tx, {
        section: input.section,
        status: input.status,
        title: input.title,
        notes: input.notes ?? undefined,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        incurredOn: parseYmdToUtcDate(input.incurredOn),
        category: input.categoryId
          ? { connect: { id: input.categoryId } }
          : undefined,
        createdBy: { connect: { id: actorUserId } },
        updatedBy: { connect: { id: actorUserId } },
      });

      if (input.tagIds.length) {
        await expenseRepository.replaceExpenseTags(
          tx,
          created.id,
          input.tagIds,
          actorUserId,
        );
      }

      await auditLogRepository.create(tx, {
        action: AuditAction.EXPENSE_CREATED,
        entityType: "Expense",
        entityId: created.id,
        actor: { connect: { id: actorUserId } },
        metadata: { title: created.title, section: created.section },
      });

      const full = await expenseRepository.findActiveById(tx, created.id);
      if (!full) {
        throw new Error("Expense missing after create");
      }
      return full;
    });

    return { ok: true, data: serializeExpense(expense) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return { ok: false, error: { code: "CREATE_FAILED", message } };
  }
}

export async function updateExpenseService(
  input: UpdateExpenseInput,
  actorUserId: number,
): Promise<ServiceResult<ExpenseDto>> {
  try {
    const existing = await expenseRepository.findActiveById(prisma, input.id);
    if (!existing) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
    }

    if (input.categoryId !== undefined) {
      await expenseRepository.assertCategoryExists(prisma, input.categoryId);
    }
    if (input.tagIds !== undefined) {
      await expenseRepository.assertTagsExist(prisma, input.tagIds);
    }

    const before = expenseRowToSnapshot(existing);

    const after: ExpenseScalarSnapshot = {
      section: input.section ?? before.section,
      status: input.status ?? before.status,
      title: input.title ?? before.title,
      notes: input.notes !== undefined ? input.notes : before.notes,
      amount: input.amount ?? before.amount,
      currency: input.currency ?? before.currency,
      incurredOn: input.incurredOn ?? before.incurredOn,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : before.categoryId,
      tagIds:
        input.tagIds !== undefined
          ? [...input.tagIds].sort()
          : before.tagIds,
    };

    if (snapshotsEqual(before, after)) {
      return {
        ok: false,
        error: { code: "NO_CHANGES", message: "No changes detected" },
      };
    }

    const batchId = randomUUID();
    const historyRows = buildExpenseHistoryRows({
      expenseId: input.id,
      batchId,
      changedById: actorUserId,
      before,
      after,
    });

    const expense = await prisma.$transaction(async (tx) => {
      const data: Prisma.ExpenseUpdateInput = {
        updatedBy: { connect: { id: actorUserId } },
      };

      if (input.section !== undefined) data.section = input.section;
      if (input.status !== undefined) data.status = input.status;
      if (input.title !== undefined) data.title = input.title;
      if (input.notes !== undefined) data.notes = input.notes;
      if (input.amount !== undefined) {
        data.amount = new Prisma.Decimal(input.amount);
      }
      if (input.currency !== undefined) data.currency = input.currency;
      if (input.incurredOn !== undefined) {
        data.incurredOn = parseYmdToUtcDate(input.incurredOn);
      }
      if (input.categoryId !== undefined) {
        data.category = input.categoryId
          ? { connect: { id: input.categoryId } }
          : { disconnect: true };
      }

      await expenseRepository.update(tx, input.id, data);

      if (input.tagIds !== undefined) {
        await expenseRepository.replaceExpenseTags(
          tx,
          input.id,
          input.tagIds,
          actorUserId,
        );
      }

      await expenseHistoryRepository.createMany(tx, historyRows);

      await auditLogRepository.create(tx, {
        action: AuditAction.EXPENSE_UPDATED,
        entityType: "Expense",
        entityId: input.id,
        actor: { connect: { id: actorUserId } },
        metadata: {
          batchId,
          fieldCount: historyRows.length,
        },
      });

      const full = await expenseRepository.findActiveById(tx, input.id);
      if (!full) {
        throw new Error("Expense missing after update");
      }
      return full;
    });

    return { ok: true, data: serializeExpense(expense) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return { ok: false, error: { code: "UPDATE_FAILED", message } };
  }
}

export async function softDeleteExpenseService(
  input: DeleteExpenseInput,
  actorUserId: number,
  actorRole: UserRole,
): Promise<ServiceResult<{ id: string }>> {
  if (actorRole !== UserRole.ADMIN) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Only administrators may delete expenses",
      },
    };
  }

  try {
    const roleFromDb = await userRepository.getRoleById(prisma, actorUserId);
    if (roleFromDb !== UserRole.ADMIN) {
      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Only administrators may delete expenses",
        },
      };
    }

    const existing = await expenseRepository.findActiveById(prisma, input.id);
    if (!existing) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Expense not found" } };
    }

    const batchId = randomUUID();
    const deletedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await expenseRepository.update(tx, input.id, {
        deletedAt,
        updatedBy: { connect: { id: actorUserId } },
      });

      await expenseHistoryRepository.createMany(tx, [
        {
          expenseId: input.id,
          batchId,
          fieldKey: "deletedAt",
          oldValue: Prisma.JsonNull,
          newValue: deletedAt.toISOString(),
          changedById: actorUserId,
        },
      ]);

      await auditLogRepository.create(tx, {
        action: AuditAction.EXPENSE_SOFT_DELETED,
        entityType: "Expense",
        entityId: input.id,
        actor: { connect: { id: actorUserId } },
        metadata: { batchId },
      });
    });

    return { ok: true, data: { id: input.id } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { ok: false, error: { code: "DELETE_FAILED", message } };
  }
}
