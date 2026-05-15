/*
  Warnings:

  - The values [EXPENSE_APPROVED,EXPENSE_REJECTED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVED,REJECTED] on the enum `ExpenseStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,APPROVER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `approvalComment` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedById` on the `expense` table. All the data in the column will be lost.

*/

-- Update data before enum change
UPDATE "audit_log" SET "action" = 'OTHER' WHERE "action" IN ('EXPENSE_APPROVED', 'EXPENSE_REJECTED');
UPDATE "expense" SET "status" = 'SUBMITTED' WHERE "status" IN ('APPROVED', 'REJECTED');
UPDATE "user" SET "role" = 'USER' WHERE "role" IN ('ADMIN', 'APPROVER');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_ROLE_CHANGED', 'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_ARCHIVED', 'EXPENSE_RESTORED', 'EXPENSE_SUBMITTED', 'EXPENSE_PAID', 'EXPENSE_CANCELLED', 'ATTACHMENT_ADDED', 'ATTACHMENT_ARCHIVED', 'TAG_ASSIGNED', 'TAG_REMOVED', 'TAG_DEACTIVATED', 'SALARY_RECORD_CREATED', 'SALARY_RECORD_UPDATED', 'CREDENTIAL_ENTRY_CREATED', 'CREDENTIAL_ENTRY_UPDATED', 'CREDENTIAL_ENTRY_DISABLED', 'CREDENTIAL_ENTRY_REENABLED', 'ALLOWED_EMAIL_CREATED', 'ALLOWED_EMAIL_UPDATED', 'ALLOWED_EMAIL_DEACTIVATED', 'FUNDENTRYCREATED', 'FUND_ENTRY_ARCHIVED', 'SETTINGS_UPDATED', 'OTHER');
ALTER TABLE "audit_log" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'PAID', 'CANCELLED');
ALTER TABLE "public"."expense" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "expense" ALTER COLUMN "status" TYPE "ExpenseStatus_new" USING ("status"::text::"ExpenseStatus_new");
ALTER TYPE "ExpenseStatus" RENAME TO "ExpenseStatus_old";
ALTER TYPE "ExpenseStatus_new" RENAME TO "ExpenseStatus";
DROP TYPE "public"."ExpenseStatus_old";
ALTER TABLE "expense" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER');
ALTER TABLE "public"."user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_rejectedById_fkey";

-- DropIndex
DROP INDEX "expense_approvedById_idx";

-- DropIndex
DROP INDEX "expense_rejectedById_idx";

-- AlterTable
ALTER TABLE "expense" DROP COLUMN "approvalComment",
DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectedById";
