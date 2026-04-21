-- User primary key and all user FKs: INTEGER -> UUID (PostgreSQL native UUID).
-- Destructive: TRUNCATE "user" CASCADE removes application data that references users
-- (expenses, categories, sessions, etc.). Re-run `pnpm prisma db seed` after migrate.
-- Tags and verification rows are preserved where they do not depend on truncated tables.

BEGIN;

-- Clear user-linked graph while FKs are still attached (PostgreSQL CASCADE rules).
TRUNCATE TABLE "user" RESTART IDENTITY CASCADE;

-- Drop FKs into user(id) before altering column types
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_fkey";
ALTER TABLE "passkey" DROP CONSTRAINT IF EXISTS "passkey_userId_fkey";
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_createdById_fkey";
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_updatedById_fkey";
ALTER TABLE "expense_tag" DROP CONSTRAINT IF EXISTS "expense_tag_assignedById_fkey";
ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "expense_createdById_fkey";
ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "expense_updatedById_fkey";
ALTER TABLE "expense_history" DROP CONSTRAINT IF EXISTS "expense_history_changedById_fkey";
ALTER TABLE "attachment" DROP CONSTRAINT IF EXISTS "attachment_uploadedById_fkey";
ALTER TABLE "inventory_item" DROP CONSTRAINT IF EXISTS "inventory_item_createdById_fkey";
ALTER TABLE "inventory_item" DROP CONSTRAINT IF EXISTS "inventory_item_updatedById_fkey";
ALTER TABLE "merchandise_item" DROP CONSTRAINT IF EXISTS "merchandise_item_createdById_fkey";
ALTER TABLE "merchandise_item" DROP CONSTRAINT IF EXISTS "merchandise_item_updatedById_fkey";
ALTER TABLE "salary_record" DROP CONSTRAINT IF EXISTS "salary_record_createdById_fkey";
ALTER TABLE "salary_record" DROP CONSTRAINT IF EXISTS "salary_record_updatedById_fkey";
ALTER TABLE "audit_log" DROP CONSTRAINT IF EXISTS "audit_log_actorId_fkey";

-- Replace SERIAL user id with UUID
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_pkey";
ALTER TABLE "user" DROP COLUMN "id";
ALTER TABLE "user" ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- Auth / domain FK columns: INTEGER -> UUID
ALTER TABLE "session" DROP COLUMN "userId";
ALTER TABLE "session" ADD COLUMN "userId" UUID NOT NULL;

ALTER TABLE "account" DROP COLUMN "userId";
ALTER TABLE "account" ADD COLUMN "userId" UUID NOT NULL;

ALTER TABLE "passkey" DROP COLUMN "userId";
ALTER TABLE "passkey" ADD COLUMN "userId" UUID NOT NULL;

ALTER TABLE "category" DROP COLUMN "createdById";
ALTER TABLE "category" ADD COLUMN "createdById" UUID;
ALTER TABLE "category" DROP COLUMN "updatedById";
ALTER TABLE "category" ADD COLUMN "updatedById" UUID;

ALTER TABLE "expense_tag" DROP COLUMN "assignedById";
ALTER TABLE "expense_tag" ADD COLUMN "assignedById" UUID;

ALTER TABLE "expense" DROP COLUMN "createdById";
ALTER TABLE "expense" ADD COLUMN "createdById" UUID NOT NULL;
ALTER TABLE "expense" DROP COLUMN "updatedById";
ALTER TABLE "expense" ADD COLUMN "updatedById" UUID;

ALTER TABLE "expense_history" DROP COLUMN "changedById";
ALTER TABLE "expense_history" ADD COLUMN "changedById" UUID NOT NULL;

ALTER TABLE "attachment" DROP COLUMN "uploadedById";
ALTER TABLE "attachment" ADD COLUMN "uploadedById" UUID;

ALTER TABLE "inventory_item" DROP COLUMN "createdById";
ALTER TABLE "inventory_item" ADD COLUMN "createdById" UUID;
ALTER TABLE "inventory_item" DROP COLUMN "updatedById";
ALTER TABLE "inventory_item" ADD COLUMN "updatedById" UUID;

ALTER TABLE "merchandise_item" DROP COLUMN "createdById";
ALTER TABLE "merchandise_item" ADD COLUMN "createdById" UUID;
ALTER TABLE "merchandise_item" DROP COLUMN "updatedById";
ALTER TABLE "merchandise_item" ADD COLUMN "updatedById" UUID;

ALTER TABLE "salary_record" DROP COLUMN "createdById";
ALTER TABLE "salary_record" ADD COLUMN "createdById" UUID;
ALTER TABLE "salary_record" DROP COLUMN "updatedById";
ALTER TABLE "salary_record" ADD COLUMN "updatedById" UUID;

ALTER TABLE "audit_log" DROP COLUMN "actorId";
ALTER TABLE "audit_log" ADD COLUMN "actorId" UUID;

-- Recreate FKs (same ON DELETE/UPDATE as phase1 foundation migration)
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category" ADD CONSTRAINT "category_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "category" ADD CONSTRAINT "category_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_tag" ADD CONSTRAINT "expense_tag_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense" ADD CONSTRAINT "expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense" ADD CONSTRAINT "expense_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchandise_item" ADD CONSTRAINT "merchandise_item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchandise_item" ADD CONSTRAINT "merchandise_item_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salary_record" ADD CONSTRAINT "salary_record_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salary_record" ADD CONSTRAINT "salary_record_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");
CREATE INDEX "category_createdById_idx" ON "category"("createdById");
CREATE INDEX "category_updatedById_idx" ON "category"("updatedById");
CREATE INDEX "expense_tag_assignedById_idx" ON "expense_tag"("assignedById");
CREATE INDEX "expense_createdById_idx" ON "expense"("createdById");
CREATE INDEX "expense_updatedById_idx" ON "expense"("updatedById");
CREATE INDEX "expense_history_changedById_idx" ON "expense_history"("changedById");
CREATE INDEX "attachment_uploadedById_idx" ON "attachment"("uploadedById");
CREATE INDEX "inventory_item_createdById_idx" ON "inventory_item"("createdById");
CREATE INDEX "inventory_item_updatedById_idx" ON "inventory_item"("updatedById");
CREATE INDEX "merchandise_item_createdById_idx" ON "merchandise_item"("createdById");
CREATE INDEX "merchandise_item_updatedById_idx" ON "merchandise_item"("updatedById");
CREATE INDEX "salary_record_createdById_idx" ON "salary_record"("createdById");
CREATE INDEX "salary_record_updatedById_idx" ON "salary_record"("updatedById");
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

COMMIT;
