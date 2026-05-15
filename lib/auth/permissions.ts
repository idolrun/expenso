import { UserRole } from "@/generated/prisma/client";

export const Permission = {
  CAN_CREATE_EXPENSE: "CAN_CREATE_EXPENSE",
  CAN_READ_EXPENSE: "CAN_READ_EXPENSE",
  CAN_UPDATE_EXPENSE: "CAN_UPDATE_EXPENSE",
  CAN_ARCHIVE_EXPENSE: "CAN_ARCHIVE_EXPENSE",
  CAN_RESTORE_EXPENSE: "CAN_RESTORE_EXPENSE",
  CAN_SUBMIT_EXPENSE: "CAN_SUBMIT_EXPENSE",
  CAN_PAY_EXPENSE: "CAN_PAY_EXPENSE",
  CAN_CANCEL_EXPENSE: "CAN_CANCEL_EXPENSE",
  CAN_BULK_ARCHIVE_EXPENSE: "CAN_BULK_ARCHIVE_EXPENSE",
  CAN_BULK_PAY_EXPENSE: "CAN_BULK_PAY_EXPENSE",
  CAN_VIEW_AUDIT_LOGS: "CAN_VIEW_AUDIT_LOGS",
  CAN_VIEW_USERS: "CAN_VIEW_USERS",
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

const USER_PERMISSIONS: ReadonlySet<Permission> = new Set([
  Permission.CAN_CREATE_EXPENSE,
  Permission.CAN_READ_EXPENSE,
  Permission.CAN_UPDATE_EXPENSE,
  Permission.CAN_ARCHIVE_EXPENSE,
  Permission.CAN_RESTORE_EXPENSE,
  Permission.CAN_SUBMIT_EXPENSE,
  Permission.CAN_CANCEL_EXPENSE,
  Permission.CAN_BULK_ARCHIVE_EXPENSE,
  Permission.CAN_VIEW_AUDIT_LOGS,
  Permission.CAN_VIEW_USERS,
  Permission.CAN_MANAGE_ALLOWED_EMAILS,
  Permission.CAN_READ_CREDENTIAL,
  Permission.CAN_CREATE_CREDENTIAL,
  Permission.CAN_UPDATE_CREDENTIAL,
  Permission.CAN_DISABLE_CREDENTIAL,
  Permission.CAN_REENABLE_CREDENTIAL,
  Permission.CAN_MANAGE_TAGS,
  Permission.CAN_MANAGE_FUNDS,
  Permission.CAN_VIEW_TRASH,
  Permission.CAN_ACCESS_ADMIN_PAGES,
]);

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role !== UserRole.USER) {
    return false;
  }
  return USER_PERMISSIONS.has(permission);
}

export function expenseCrudPermissions(role: UserRole) {
  return {
    canCreate: hasPermission(role, Permission.CAN_CREATE_EXPENSE),
    canRead: hasPermission(role, Permission.CAN_READ_EXPENSE),
    canUpdate: hasPermission(role, Permission.CAN_UPDATE_EXPENSE),
    canArchive: hasPermission(role, Permission.CAN_ARCHIVE_EXPENSE),
    canRestore: hasPermission(role, Permission.CAN_RESTORE_EXPENSE),
    canSubmit: hasPermission(role, Permission.CAN_SUBMIT_EXPENSE),
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
