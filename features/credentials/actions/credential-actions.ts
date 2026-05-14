"use server";

import { revalidatePath } from "next/cache";

import { getSession, parseUserRole } from "@/lib/auth/session";
import { sessionToUserId } from "@/lib/auth/actor";
import {
  canCreateCredential,
  canUpdateCredential,
  canDisableCredential,
  canReEnableCredential,
} from "@/lib/auth/permissions";
import {
  createCredentialSchema,
  updateCredentialSchema,
  disableCredentialSchema,
  reEnableCredentialSchema,
} from "@/features/credentials/validation/credential";
import {
  createCredentialService,
  updateCredentialService,
  disableCredentialService,
  reEnableCredentialService,
} from "@/features/credentials/application/credential.service";
import type { CredentialEntryRecord } from "@/features/credentials/domain/types";

async function requireSessionUser() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      error: "Sign in required",
    };
  }
  return {
    ok: true as const,
    session,
    userId: sessionToUserId(session),
    role: parseUserRole(session.user.role),
  };
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCredential(
  formData: unknown,
): Promise<ActionResult<CredentialEntryRecord>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  if (!canCreateCredential(auth.role)) {
    return { success: false, error: "Cannot create credential entries" };
  }

  const parsed = createCredentialSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const result = await createCredentialService(parsed.data, auth.userId);
  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/dashboard/credentials");
  return { success: true, data: result.data };
}

export async function updateCredential(
  formData: unknown,
): Promise<ActionResult<CredentialEntryRecord>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  if (!canUpdateCredential(auth.role)) {
    return { success: false, error: "Cannot update credential entries" };
  }

  const parsed = updateCredentialSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const result = await updateCredentialService(parsed.data, auth.userId);
  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/dashboard/credentials");
  return { success: true, data: result.data };
}

export async function disableCredential(data: {
  id: string;
}): Promise<ActionResult<CredentialEntryRecord>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  if (!canDisableCredential(auth.role)) {
    return { success: false, error: "Cannot disable credential entries" };
  }

  const parsed = disableCredentialSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const result = await disableCredentialService(parsed.data.id, auth.userId);
  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/dashboard/credentials");
  return { success: true, data: result.data };
}

export async function reEnableCredential(data: {
  id: string;
}): Promise<ActionResult<CredentialEntryRecord>> {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  if (!canReEnableCredential(auth.role)) {
    return { success: false, error: "Cannot re-enable credential entries" };
  }

  const parsed = reEnableCredentialSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const result = await reEnableCredentialService(
    parsed.data.id,
    auth.userId,
  );
  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/dashboard/credentials");
  return { success: true, data: result.data };
}
