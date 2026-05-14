"use server";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession, parseUserRole } from "@/lib/auth/session";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { AllowedEmailDto } from "@/features/allowed-emails/domain/allowed-email";
import {
  listAllowedEmails,
  createAllowedEmail,
  updateAllowedEmail,
  deactivateAllowedEmail,
} from "@/features/allowed-emails/application/allowed-email.service";

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

export async function listAllowedEmailsAction(): Promise<
  ServiceResult<AllowedEmailDto[]>
> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return listAllowedEmails();
}

export async function createAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<AllowedEmailDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return createAllowedEmail(auth.userId, raw);
}

export async function updateAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<AllowedEmailDto>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return updateAllowedEmail(auth.userId, raw);
}

export async function deactivateAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return deactivateAllowedEmail(auth.userId, raw);
}
