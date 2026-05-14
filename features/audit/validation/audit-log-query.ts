import { z } from "zod";

/** Mirrors `AuditAction` in Prisma — kept string-only so client bundles never import `@prisma/client`. */
export const auditActionValues = [
  "USER_ROLE_CHANGED",
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_SOFT_DELETED",
  "EXPENSE_RESTORED",
  "ATTACHMENT_ADDED",
  "ATTACHMENT_REMOVED",
  "TAG_ASSIGNED",
  "TAG_REMOVED",
  // CATEGORY_CREATED, CATEGORY_UPDATED, CATEGORY_DELETED — deprecated
  "SALARY_RECORD_CREATED",
  "SALARY_RECORD_UPDATED",
  "CREDENTIAL_ENTRY_CREATED",
  "CREDENTIAL_ENTRY_UPDATED",
  "CREDENTIAL_ENTRY_DISABLED",
  "CREDENTIAL_ENTRY_REENABLED",
  "ALLOWED_EMAIL_CREATED",
  "ALLOWED_EMAIL_UPDATED",
  "ALLOWED_EMAIL_DELETED",
  "FUNDENTRYCREATED",
  "OTHER",
] as const;

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(auditActionValues).optional(),
  entityType: z.string().trim().max(120).optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
