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

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return true;
}

export function expenseCrudPermissions(role: UserRole) {
  return {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canArchive: true,
    canRestore: true,
    canSubmit: true,
    canPay: true,
    canCancel: true,
  } as const;
}

export function credentialCrudPermissions(role: UserRole) {
  return {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDisable: true,
    canReEnable: true,
  } as const;
}
