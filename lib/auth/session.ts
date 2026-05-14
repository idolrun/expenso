import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export function parseUserRole(role: unknown): UserRole {
  if (role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER) {
    return role;
  }
  return UserRole.USER;
}
