import { userRecordIdSchema } from "@/features/expenses/validation/primitives";

export type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<(typeof import("@/lib/auth/session"))["getSession"]>>
>;

/** Resolves Better Auth session user id to Prisma `User.id` (UUID string). */
export function sessionToUserId(session: AuthenticatedSession): string {
  const raw = String(session.user.id ?? "").trim();
  const parsed = userRecordIdSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid session user id");
  }
  return parsed.data;
}
