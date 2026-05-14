-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_ROLE_CHANGED', 'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_SOFT_DELETED', 'EXPENSE_RESTORED', 'EXPENSE_SUBMITTED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'EXPENSE_PAID', 'EXPENSE_CANCELLED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'TAG_ASSIGNED', 'TAG_REMOVED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'SALARY_RECORD_CREATED', 'SALARY_RECORD_UPDATED', 'CREDENTIAL_ENTRY_CREATED', 'CREDENTIAL_ENTRY_UPDATED', 'CREDENTIAL_ENTRY_DISABLED', 'CREDENTIAL_ENTRY_REENABLED', 'ALLOWED_EMAIL_CREATED', 'ALLOWED_EMAIL_UPDATED', 'ALLOWED_EMAIL_DELETED', 'FUNDENTRYCREATED', 'OTHER');
ALTER TABLE "audit_log" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'APPROVER';

-- AlterTable
ALTER TABLE "expense" ADD COLUMN     "allocatedAmount" DECIMAL(19,4),
ADD COLUMN     "allocatedFundEntryId" TEXT,
ADD COLUMN     "approvalComment" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" UUID,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" UUID,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" UUID;

-- CreateIndex
CREATE INDEX "expense_allocatedFundEntryId_idx" ON "expense"("allocatedFundEntryId");

-- CreateIndex
CREATE INDEX "expense_submittedById_idx" ON "expense"("submittedById");

-- CreateIndex
CREATE INDEX "expense_approvedById_idx" ON "expense"("approvedById");

-- CreateIndex
CREATE INDEX "expense_rejectedById_idx" ON "expense"("rejectedById");

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_allocatedFundEntryId_fkey" FOREIGN KEY ("allocatedFundEntryId") REFERENCES "fund_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
