"use server";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession, parseUserRole } from "@/lib/auth/session";
import { canCreateExpense } from "@/lib/auth/permissions";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { SectionBudgetDto } from "@/features/budgets/domain/dto";
import {
  createSectionBudgetSchema,
  updateSectionBudgetSchema,
} from "@/features/budgets/validation/budget";
import {
  createSectionBudgetService,
  updateSectionBudgetService,
} from "@/features/budgets/application/budget.service";

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

export async function createSectionBudgetAction(
  raw: unknown,
): Promise<ServiceResult<SectionBudgetDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const role = parseUserRole(auth.session.user.role);
  if (!canCreateExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot create budgets" } };
  }

  const parsed = createSectionBudgetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  return createSectionBudgetService(parsed.data, auth.userId);
}

export async function updateSectionBudgetAction(
  raw: unknown,
): Promise<ServiceResult<SectionBudgetDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const role = parseUserRole(auth.session.user.role);
  if (!canCreateExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot update budgets" } };
  }

  const parsed = updateSectionBudgetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  return updateSectionBudgetService(parsed.data, auth.userId);
}
