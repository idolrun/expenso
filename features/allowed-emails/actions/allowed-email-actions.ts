"use server";

import { UserRole } from "@/generated/prisma/client";

import { sessionToUserId } from "@/lib/auth/actor";
import { getSession, parseUserRole } from "@/lib/auth/session";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { AllowedEmailDto } from "@/features/allowed-emails/domain/allowed-email";
import {
  listAllowedEmails,
  createAllowedEmail,
  updateAllowedEmail,
  deleteAllowedEmail,
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

async function requireAdmin() {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return auth;
  }
  const role = parseUserRole(auth.session.user.role);
  if (role !== UserRole.ADMIN) {
    return {
      ok: false as const,
      error: { code: "FORBIDDEN", message: "Admin only" },
    };
  }
  return auth;
}

async function requireAllowedEmailManager() {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return auth;
  }
  const role = parseUserRole(auth.session.user.role);
  if (role !== UserRole.ADMIN && role !== UserRole.USER) {
    return {
      ok: false as const,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    };
  }
  return auth;
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

export async function deleteAllowedEmailAction(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  return deleteAllowedEmail(auth.userId, raw);
}
