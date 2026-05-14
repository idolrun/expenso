import { UserRole } from "@/generated/prisma/client";

/** Expense domain (Phase 3+): USER may not hard-delete; ADMIN may. */
export function canDeleteExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canCreateExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

export function canReadExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

export function canUpdateExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

export function expenseCrudPermissions(role: UserRole) {
  return {
    canCreate: canCreateExpense(role),
    canRead: canReadExpense(role),
    canUpdate: canUpdateExpense(role),
    canDelete: canDeleteExpense(role),
  } as const;
}

/** Workflow permissions */
export function canSubmitForApproval(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

export function canApproveExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER;
}

export function canPayExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canCancelExpense(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canAccessApprovals(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER;
}

/** Credential vault: any authenticated user may read. */
export function canReadCredential(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

/** Credential vault: any authenticated user may create. */
export function canCreateCredential(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

/** Credential vault: any authenticated user may update. */
export function canUpdateCredential(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

/** Credential vault: any authenticated user may disable. */
export function canDisableCredential(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.APPROVER || role === UserRole.USER;
}

/** Credential vault: only ADMIN may re-enable. */
export function canReEnableCredential(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function credentialCrudPermissions(role: UserRole) {
  return {
    canCreate: canCreateCredential(role),
    canRead: canReadCredential(role),
    canUpdate: canUpdateCredential(role),
    canDisable: canDisableCredential(role),
    canReEnable: canReEnableCredential(role),
  } as const;
}
