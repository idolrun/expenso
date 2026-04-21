"use server";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession, parseUserRole } from "@/lib/auth/session";
import {
  canCreateExpense,
  canDeleteExpense,
  canUpdateExpense,
} from "@/lib/auth/permissions";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import {
  createExpenseSchema,
  deleteExpenseSchema,
  updateExpenseSchema,
} from "@/features/expenses/validation/expense";
import {
  createExpenseService,
  softDeleteExpenseService,
  updateExpenseService,
} from "@/features/expenses/application/expense.service";

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

export async function createExpenseAction(
  raw: unknown,
): Promise<ServiceResult<ExpenseDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  if (!canCreateExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot create" } };
  }

  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  return createExpenseService(parsed.data, auth.userId);
}

export async function updateExpenseAction(
  raw: unknown,
): Promise<ServiceResult<ExpenseDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  if (!canUpdateExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot update" } };
  }

  const parsed = updateExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  return updateExpenseService(parsed.data, auth.userId);
}

export async function deleteExpenseAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  if (!canDeleteExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot delete" } };
  }

  const parsed = deleteExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  return softDeleteExpenseService(parsed.data, auth.userId, role);
}
