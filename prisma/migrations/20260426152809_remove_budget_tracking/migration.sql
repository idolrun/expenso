/*
  Warnings:

  - The values [SECTION_BUDGET_CREATED,SECTION_BUDGET_UPDATED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `section_budget` table. If the table is not empty, all the data it contains will be lost.

*/
-- Remove audit logs that reference the enum values being deleted
DELETE FROM "audit_log" WHERE action IN ('SECTION_BUDGET_CREATED', 'SECTION_BUDGET_UPDATED');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_ROLE_CHANGED', 'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_SOFT_DELETED', 'EXPENSE_RESTORED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'TAG_ASSIGNED', 'TAG_REMOVED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'INVENTORY_ITEM_CREATED', 'INVENTORY_ITEM_UPDATED', 'MERCHANDISE_ITEM_CREATED', 'MERCHANDISE_ITEM_UPDATED', 'SALARY_RECORD_CREATED', 'SALARY_RECORD_UPDATED', 'CREDENTIAL_ENTRY_CREATED', 'CREDENTIAL_ENTRY_UPDATED', 'CREDENTIAL_ENTRY_DISABLED', 'CREDENTIAL_ENTRY_REENABLED', 'OTHER');
ALTER TABLE "audit_log" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "section_budget" DROP CONSTRAINT "section_budget_createdById_fkey";

-- DropForeignKey
ALTER TABLE "section_budget" DROP CONSTRAINT "section_budget_updatedById_fkey";

-- DropTable
DROP TABLE "section_budget";

-- DropEnum
DROP TYPE "BudgetPeriod";
