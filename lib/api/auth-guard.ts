import { NextResponse } from "next/server";

import { getSession, parseUserRole } from "@/lib/auth/session";
import {
  canCreateExpense,
  canReadExpense,
  canReadCredential,
} from "@/lib/auth/permissions";
import { sessionToUserId } from "@/lib/auth/actor";
import { UserRole } from "@/generated/prisma/client";

export async function requireExpenseReader() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  if (!canReadExpense(role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role, userId: sessionToUserId(session) };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireFundReader(_request?: Request) {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  return { ok: true as const, session, role, userId: sessionToUserId(session) };
}

export async function requireExpenseWriter() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  if (!canCreateExpense(role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role, userId: sessionToUserId(session) };
}

/**
 * Minimal guard — any authenticated session is accepted.
 * Used for attachment access where role-level policies aren't needed
 * (expense ownership is the gate).
 */
export async function requireAuthenticatedUser() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  return {
    ok: true as const,
    session,
    role: parseUserRole(session.user.role),
    userId: sessionToUserId(session),
  };
}

export async function requireCredentialReader() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  if (!canReadCredential(role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role, userId: sessionToUserId(session) };
}

export async function requireAuditReader() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }
  const role = parseUserRole(session.user.role);
  if (role !== UserRole.ADMIN) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Admin only" } },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role, userId: sessionToUserId(session) };
}
