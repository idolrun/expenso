/** Browser-safe role literals (avoid importing Prisma enums in client components). */
export type AppUserRole = "ADMIN" | "APPROVER" | "USER";

export function toAppUserRole(role: unknown): AppUserRole {
  if (role === "ADMIN") return "ADMIN";
  if (role === "APPROVER") return "APPROVER";
  return "USER";
}
