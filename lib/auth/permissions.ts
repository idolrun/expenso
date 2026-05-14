import { UserRole } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Permission constants
// ---------------------------------------------------------------------------

export const Permission = {
  CAN_CREATE_EXPENSE: "CAN_CREATE_EXPENSE",
  CAN_READ_EXPENSE: "CAN_READ_EXPENSE",
  CAN_UPDATE_EXPENSE: "CAN_UPDATE_EXPENSE",
  CAN_ARCHIVE_EXPENSE: "CAN_ARCHIVE_EXPENSE",
  CAN_RESTORE_EXPENSE: "CAN_RESTORE_EXPENSE",
  CAN_SUBMIT_EXPENSE: "CAN_SUBMIT_EXPENSE",
  CAN_APPROVE_EXPENSE: "CAN_APPROVE_EXPENSE",
  CAN_REJECT_EXPENSE: "CAN_REJECT_EXPENSE",
  CAN_PAY_EXPENSE: "CAN_PAY_EXPENSE",
  CAN_CANCEL_EXPENSE: "CAN_CANCEL_EXPENSE",
  CAN_BULK_ARCHIVE_EXPENSE: "CAN_BULK_ARCHIVE_EXPENSE",
  CAN_BULK_PAY_EXPENSE: "CAN_BULK_PAY_EXPENSE",
  CAN_VIEW_AUDIT_LOGS: "CAN_VIEW_AUDIT_LOGS",
  CAN_MANAGE_ALLOWED_EMAILS: "CAN_MANAGE_ALLOWED_EMAILS",
  CAN_MANAGE_USERS: "CAN_MANAGE_USERS",
  CAN_READ_CREDENTIAL: "CAN_READ_CREDENTIAL",
  CAN_CREATE_CREDENTIAL: "CAN_CREATE_CREDENTIAL",
  CAN_UPDATE_CREDENTIAL: "CAN_UPDATE_CREDENTIAL",
  CAN_DISABLE_CREDENTIAL: "CAN_DISABLE_CREDENTIAL",
  CAN_REENABLE_CREDENTIAL: "CAN_REENABLE_CREDENTIAL",
  CAN_MANAGE_TAGS: "CAN_MANAGE_TAGS",
  CAN_MANAGE_FUNDS: "CAN_MANAGE_FUNDS",
  CAN_VIEW_TRASH: "CAN_VIEW_TRASH",
  CAN_ACCESS_ADMIN_PAGES: "CAN_ACCESS_ADMIN_PAGES",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Permission matrix — all authenticated users get most permissions.
// Only approval workflow actions remain restricted to ADMIN + APPROVER.
// ---------------------------------------------------------------------------

export function hasPermission(role: UserRole, permission: Permission): boolean {
  // All authenticated users have these base permissions
  const basePermissions: Permission[] = [
    Permission.CAN_CREATE_EXPENSE,
    Permission.CAN_READ_EXPENSE,
    Permission.CAN_UPDATE_EXPENSE,
    Permission.CAN_ARCHIVE_EXPENSE,
    Permission.CAN_RESTORE_EXPENSE,
    Permission.CAN_SUBMIT_EXPENSE,
    Permission.CAN_CANCEL_EXPENSE,
    Permission.CAN_BULK_ARCHIVE_EXPENSE,
    Permission.CAN_VIEW_AUDIT_LOGS,
    Permission.CAN_MANAGE_ALLOWED_EMAILS,
    Permission.CAN_MANAGE_USERS,
    Permission.CAN_READ_CREDENTIAL,
    Permission.CAN_CREATE_CREDENTIAL,
    Permission.CAN_UPDATE_CREDENTIAL,
    Permission.CAN_DISABLE_CREDENTIAL,
    Permission.CAN_REENABLE_CREDENTIAL,
    Permission.CAN_MANAGE_TAGS,
    Permission.CAN_MANAGE_FUNDS,
    Permission.CAN_VIEW_TRASH,
    Permission.CAN_ACCESS_ADMIN_PAGES,
  ];

  if (basePermissions.includes(permission)) {
    return true;
  }

  // Approval workflow: ADMIN + APPROVER only
  const approverPermissions: Permission[] = [
    Permission.CAN_APPROVE_EXPENSE,
    Permission.CAN_REJECT_EXPENSE,
    Permission.CAN_PAY_EXPENSE,
    Permission.CAN_BULK_PAY_EXPENSE,
  ];

  if (approverPermissions.includes(permission)) {
    return role === UserRole.ADMIN || role === UserRole.APPROVER;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Legacy compatibility helpers (deprecated — use hasPermission directly)
// ---------------------------------------------------------------------------

/** @deprecated Use hasPermission(role, Permission.CAN_ARCHIVE_EXPENSE) */
export function canDeleteExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_ARCHIVE_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_CREATE_EXPENSE) */
export function canCreateExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_CREATE_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_READ_EXPENSE) */
export function canReadExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_READ_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_UPDATE_EXPENSE) */
export function canUpdateExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_UPDATE_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_SUBMIT_EXPENSE) */
export function canSubmitForApproval(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_SUBMIT_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_APPROVE_EXPENSE) */
export function canApproveExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_APPROVE_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_PAY_EXPENSE) */
export function canPayExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_PAY_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_CANCEL_EXPENSE) */
export function canCancelExpense(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_CANCEL_EXPENSE);
}

/** @deprecated Use hasPermission(role, Permission.CAN_ACCESS_ADMIN_PAGES) */
export function canAccessAdmin(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_ACCESS_ADMIN_PAGES);
}

/** @deprecated Use hasPermission(role, Permission.CAN_ACCESS_ADMIN_PAGES) */
export function canAccessApprovals(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_ACCESS_ADMIN_PAGES);
}

/** @deprecated Use hasPermission(role, Permission.CAN_READ_CREDENTIAL) */
export function canReadCredential(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_READ_CREDENTIAL);
}

/** @deprecated Use hasPermission(role, Permission.CAN_CREATE_CREDENTIAL) */
export function canCreateCredential(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_CREATE_CREDENTIAL);
}

/** @deprecated Use hasPermission(role, Permission.CAN_UPDATE_CREDENTIAL) */
export function canUpdateCredential(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_UPDATE_CREDENTIAL);
}

/** @deprecated Use hasPermission(role, Permission.CAN_DISABLE_CREDENTIAL) */
export function canDisableCredential(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_DISABLE_CREDENTIAL);
}

/** @deprecated Use hasPermission(role, Permission.CAN_REENABLE_CREDENTIAL) */
export function canReEnableCredential(role: UserRole): boolean {
  return hasPermission(role, Permission.CAN_REENABLE_CREDENTIAL);
}

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

export function expenseCrudPermissions(role: UserRole) {
  return {
    canCreate: hasPermission(role, Permission.CAN_CREATE_EXPENSE),
    canRead: hasPermission(role, Permission.CAN_READ_EXPENSE),
    canUpdate: hasPermission(role, Permission.CAN_UPDATE_EXPENSE),
    canArchive: hasPermission(role, Permission.CAN_ARCHIVE_EXPENSE),
    canRestore: hasPermission(role, Permission.CAN_RESTORE_EXPENSE),
    canSubmit: hasPermission(role, Permission.CAN_SUBMIT_EXPENSE),
    canApprove: hasPermission(role, Permission.CAN_APPROVE_EXPENSE),
    canReject: hasPermission(role, Permission.CAN_REJECT_EXPENSE),
    canPay: hasPermission(role, Permission.CAN_PAY_EXPENSE),
    canCancel: hasPermission(role, Permission.CAN_CANCEL_EXPENSE),
  } as const;
}

export function credentialCrudPermissions(role: UserRole) {
  return {
    canCreate: hasPermission(role, Permission.CAN_CREATE_CREDENTIAL),
    canRead: hasPermission(role, Permission.CAN_READ_CREDENTIAL),
    canUpdate: hasPermission(role, Permission.CAN_UPDATE_CREDENTIAL),
    canDisable: hasPermission(role, Permission.CAN_DISABLE_CREDENTIAL),
    canReEnable: hasPermission(role, Permission.CAN_REENABLE_CREDENTIAL),
  } as const;
}
