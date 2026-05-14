import { z } from "zod";

/** Mirrors `AuditAction` in Prisma — kept string-only so client bundles never import `@prisma/client`. */
export const auditActionValues = [
  "USER_ROLE_CHANGED",
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_ARCHIVED",
  "EXPENSE_RESTORED",
  "EXPENSE_SUBMITTED",
  "EXPENSE_APPROVED",
  "EXPENSE_REJECTED",
  "EXPENSE_PAID",
  "EXPENSE_CANCELLED",
  "ATTACHMENT_ADDED",
  "ATTACHMENT_ARCHIVED",
  "TAG_ASSIGNED",
  "TAG_REMOVED",
  "TAG_DEACTIVATED",
  // CATEGORY_CREATED, CATEGORY_UPDATED, CATEGORY_DELETED — deprecated
  "SALARY_RECORD_CREATED",
  "SALARY_RECORD_UPDATED",
  "CREDENTIAL_ENTRY_CREATED",
  "CREDENTIAL_ENTRY_UPDATED",
  "CREDENTIAL_ENTRY_DISABLED",
  "CREDENTIAL_ENTRY_REENABLED",
  "ALLOWED_EMAIL_CREATED",
  "ALLOWED_EMAIL_UPDATED",
  "ALLOWED_EMAIL_DEACTIVATED",
  "FUNDENTRYCREATED",
  "FUND_ENTRY_ARCHIVED",
  "SETTINGS_UPDATED",
  "OTHER",
] as const;

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(auditActionValues).optional(),
  entityType: z.string().trim().max(120).optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
