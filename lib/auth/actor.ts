export type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<(typeof import("@/lib/auth/session"))["getSession"]>>
>;

/** Resolves Better Auth user id to the numeric Prisma `User.id`. */
export function sessionToUserId(session: AuthenticatedSession): number {
  const raw = session.user.id as string | number;
  const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("Invalid session user id");
  }
  return n;
}
