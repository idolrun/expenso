/** Browser-safe role literals (avoid importing Prisma enums in client components). */
export type AppUserRole = "ADMIN" | "USER";

export function toAppUserRole(role: unknown): AppUserRole {
  return role === "ADMIN" ? "ADMIN" : "USER";
}
