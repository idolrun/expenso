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
import { hasPermission, Permission } from "@/lib/auth/permissions";

async function requireAllowedEmailManager() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    };
  }

  const role = parseUserRole(session.user.role);
  if (!hasPermission(role, Permission.CAN_MANAGE_ALLOWED_EMAILS)) {
    return {
      ok: false as const,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    };
  }

  return {
    ok: true as const,
    session,
    userId: sessionToUserId(session),
  };
}

export async function listAllowedEmailsAction(): Promise<
  ServiceResult<AllowedEmailDto[]>
> {
  const auth = await requireAllowedEmailManager();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return listAllowedEmails();
}

export async function createAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<AllowedEmailDto>> {
  const auth = await requireAllowedEmailManager();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return createAllowedEmail(auth.userId, raw);
}

export async function updateAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<AllowedEmailDto>> {
  const auth = await requireAllowedEmailManager();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return updateAllowedEmail(auth.userId, raw);
}

export async function deactivateAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireAllowedEmailManager();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return deactivateAllowedEmail(auth.userId, raw);
}
