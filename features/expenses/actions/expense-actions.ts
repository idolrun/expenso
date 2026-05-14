"use server";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession, parseUserRole } from "@/lib/auth/session";
import {
  canCreateExpense,
  canDeleteExpense,
  canUpdateExpense,
  canSubmitForApproval,
  canApproveExpense,
  canPayExpense,
  canCancelExpense,
  canAccessApprovals,
} from "@/lib/auth/permissions";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import {
  createExpenseSchema,
  deleteExpenseSchema,
  updateExpenseSchema,
} from "@/features/expenses/validation/expense";
import {
  submitForApprovalSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
  payExpenseSchema,
  cancelExpenseSchema,
} from "@/features/expenses/validation/workflow";
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import {
  createExpenseService,
  softDeleteExpenseService,
  updateExpenseService,
} from "@/features/expenses/application/expense.service";
import {
  submitForApprovalService,
  approveExpenseService,
  rejectExpenseService,
  payExpenseService,
  cancelExpenseService,
} from "@/features/expenses/application/expense-workflow.service";
import { listExpenses } from "@/features/expenses/application/expense-query.service";
import { validateReceiptFile } from "@/features/attachments/validation/attachment";

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

function parseFormPayload<T>(formData: FormData): T | null {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === "files" && value instanceof File) {
      files.push(value);
    }
  }
  return files;
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

export async function createExpenseWithAttachmentsAction(
  formData: FormData,
): Promise<ServiceResult<ExpenseDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  if (!canCreateExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot create" } };
  }

  const payload = parseFormPayload<Record<string, unknown>>(formData);
  if (!payload) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid payload" },
    };
  }

  const parsed = createExpenseSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const files = extractFiles(formData);
  const fileErrors: string[] = [];
  for (const file of files) {
    const err = validateReceiptFile(file);
    if (err) {
      fileErrors.push(err.code);
    }
  }
  if (fileErrors.length > 0) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Invalid attachment(s): ${fileErrors.join(", ")}`,
      },
    };
  }

  return createExpenseService(parsed.data, auth.userId, files);
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

export async function updateExpenseWithAttachmentsAction(
  formData: FormData,
): Promise<ServiceResult<ExpenseDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const role = parseUserRole(auth.session.user.role);
  if (!canUpdateExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot update" } };
  }

  const payload = parseFormPayload<Record<string, unknown>>(formData);
  if (!payload) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid payload" },
    };
  }

  const parsed = updateExpenseSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const files = extractFiles(formData);
  const fileErrors: string[] = [];
  for (const file of files) {
    const err = validateReceiptFile(file);
    if (err) {
      fileErrors.push(err.code);
    }
  }
  if (fileErrors.length > 0) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Invalid attachment(s): ${fileErrors.join(", ")}`,
      },
    };
  }

  return updateExpenseService(parsed.data, auth.userId, files);
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

// ---------------------------------------------------------------------------
// Workflow actions
// ---------------------------------------------------------------------------

export async function submitForApprovalAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const role = parseUserRole(auth.session.user.role);
  if (!canSubmitForApproval(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot submit" } };
  }

  const parsed = submitForApprovalSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") },
    };
  }

  return submitForApprovalService(parsed.data, auth.userId);
}

export async function approveExpenseAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const role = parseUserRole(auth.session.user.role);
  if (!canApproveExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot approve" } };
  }

  const parsed = approveExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") },
    };
  }

  return approveExpenseService(parsed.data, auth.userId, role);
}

export async function rejectExpenseAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const role = parseUserRole(auth.session.user.role);
  if (!canApproveExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot reject" } };
  }

  const parsed = rejectExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") },
    };
  }

  return rejectExpenseService(parsed.data, auth.userId, role);
}

export async function payExpenseAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const role = parseUserRole(auth.session.user.role);
  if (!canPayExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot pay" } };
  }

  const parsed = payExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") },
    };
  }

  return payExpenseService(parsed.data, auth.userId);
}

export async function cancelExpenseAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const role = parseUserRole(auth.session.user.role);
  if (!canCancelExpense(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot cancel" } };
  }

  const parsed = cancelExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") },
    };
  }

  return cancelExpenseService(parsed.data, auth.userId, role);
}

export async function listPendingApprovalsAction(
  query: ListExpensesQuery,
): Promise<ServiceResult<import("@/features/expenses/domain/dto").PaginatedDto<ExpenseDto>>> {
  const auth = await requireSessionUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  const role = parseUserRole(auth.session.user.role);
  if (!canAccessApprovals(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot access approvals" } };
  }

  return listExpenses({ ...query, status: "SUBMITTED" });
}
