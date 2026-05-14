-- Migration: Non-destructive schema hardening
-- - Add archival fields to FundEntry, Attachment, SalaryRecord, Tag
-- - Replace dangerous CASCADE with RESTRICT on domain models
-- - Add new audit actions for archival workflows

-- 1. Add archival fields
ALTER TABLE "fund_entry" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "fund_entry_deletedAt_idx" ON "fund_entry"("deletedAt");

ALTER TABLE "attachment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "attachment_deletedAt_idx" ON "attachment"("deletedAt");

ALTER TABLE "salary_record" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "salary_record_deletedAt_idx" ON "salary_record"("deletedAt");

ALTER TABLE "tag" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "tag_isActive_idx" ON "tag"("isActive");

-- 2. Backfill
UPDATE "tag" SET "isActive" = true WHERE "isActive" IS NULL;

-- 3. Add new audit action enum values (PostgreSQL enum append)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EXPENSE_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ATTACHMENT_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TAG_DEACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ALLOWED_EMAIL_DEACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FUND_ENTRY_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SETTINGS_UPDATED';

-- Note: Changing onDelete from Cascade to Restrict requires dropping and recreating
-- foreign key constraints. This is done safely below only if the constraints exist.

-- 4. ExpenseTag expense FK: Cascade -> Restrict
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expense_tag_expenseId_fkey' AND constraint_type = 'FOREIGN KEY') THEN
    ALTER TABLE "expense_tag" DROP CONSTRAINT "expense_tag_expenseId_fkey";
    ALTER TABLE "expense_tag" ADD CONSTRAINT "expense_tag_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. ExpenseTag tag FK: Cascade -> Restrict
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expense_tag_tagId_fkey' AND constraint_type = 'FOREIGN KEY') THEN
    ALTER TABLE "expense_tag" DROP CONSTRAINT "expense_tag_tagId_fkey";
    ALTER TABLE "expense_tag" ADD CONSTRAINT "expense_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. ExpenseHistory expense FK: Cascade -> Restrict
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expense_history_expenseId_fkey' AND constraint_type = 'FOREIGN KEY') THEN
    ALTER TABLE "expense_history" DROP CONSTRAINT "expense_history_expenseId_fkey";
    ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 7. Attachment expense FK: Cascade -> Restrict
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attachment_expenseId_fkey' AND constraint_type = 'FOREIGN KEY') THEN
    ALTER TABLE "attachment" DROP CONSTRAINT "attachment_expenseId_fkey";
    ALTER TABLE "attachment" ADD CONSTRAINT "attachment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 8. CredentialHistory entry FK: Cascade -> Restrict
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'credential_history_entryId_fkey' AND constraint_type = 'FOREIGN KEY') THEN
    ALTER TABLE "credential_history" DROP CONSTRAINT "credential_history_entryId_fkey";
    ALTER TABLE "credential_history" ADD CONSTRAINT "credential_history_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "credential_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
