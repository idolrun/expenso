import { UserRole } from "@/app/generated/prisma/client";

/** Expense domain (Phase 3+): USER may not hard-delete; ADMIN may. */
export function canDeleteExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canCreateExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.USER;
}

export function canReadExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.USER;
}

export function canUpdateExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.USER;
}

export function expenseCrudPermissions(role: UserRole) {
  return {
    canCreate: canCreateExpense(role),
    canRead: canReadExpense(role),
    canUpdate: canUpdateExpense(role),
    canDelete: canDeleteExpense(role),
  } as const;
}
