"use server";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession } from "@/lib/auth/session";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { ExpenseDto } from "@/features/expenses/domain/dto";
import {
  createExpenseSchema,
  archiveExpenseSchema,
  updateExpenseSchema,
} from "@/features/expenses/validation/expense";
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import {
  createExpenseService,
  archiveExpenseService,
  updateExpenseService,
} from "@/features/expenses/application/expense.service";
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

export async function archiveExpenseAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = archiveExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  return archiveExpenseService(parsed.data, auth.userId);
}
