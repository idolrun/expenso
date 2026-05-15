/** Browser-safe role literals (avoid importing Prisma enums in client components). */
export type AppUserRole = "USER";

export function toAppUserRole(role: unknown): AppUserRole {
  return "USER";
}
