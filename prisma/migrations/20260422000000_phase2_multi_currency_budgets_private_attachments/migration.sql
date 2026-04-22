-- Phase 2 — Multi-currency, private attachments, section budgets
-- Generated migration (apply with: pnpm db:migrate or pnpm db:deploy in CI)

-- ---------------------------------------------------------------------------
-- 1. New enum types
-- ---------------------------------------------------------------------------

CREATE TYPE "AttachmentProvider" AS ENUM ('CLOUDINARY', 'LOCAL');
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- ---------------------------------------------------------------------------
-- 2. Extend AuditAction enum with budget events
-- ---------------------------------------------------------------------------

ALTER TYPE "AuditAction" ADD VALUE 'SECTION_BUDGET_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_BUDGET_UPDATED';

-- ---------------------------------------------------------------------------
-- 3. Expense: rename amount/currency, add FX snapshot columns
-- ---------------------------------------------------------------------------

ALTER TABLE "expense"
    RENAME COLUMN "amount" TO "originalAmount";

ALTER TABLE "expense"
    RENAME COLUMN "currency" TO "originalCurrency";

ALTER TABLE "expense"
    ADD COLUMN "amountUsd"        DECIMAL(19, 4),
    ADD COLUMN "amountNpr"        DECIMAL(19, 4),
    ADD COLUMN "fxRateUsdNpr"     DECIMAL(14, 6),
    ADD COLUMN "fxRateSnapshotAt" TIMESTAMP(3);

-- Drop old currency-agnostic indexes that referenced the old column names
DROP INDEX IF EXISTS "expense_amount_idx";

-- New and updated indexes for multi-currency queries
CREATE INDEX "expense_originalCurrency_deletedAt_idx"              ON "expense"("originalCurrency", "deletedAt");
CREATE INDEX "expense_originalCurrency_incurredOn_deletedAt_idx"   ON "expense"("originalCurrency", "incurredOn", "deletedAt");
CREATE INDEX "expense_originalAmount_idx"                          ON "expense"("originalAmount");

-- ---------------------------------------------------------------------------
-- 4. Attachment: add provider enum, Cloudinary metadata, access-control flag
-- ---------------------------------------------------------------------------

ALTER TABLE "attachment"
    ADD COLUMN "provider"           "AttachmentProvider" NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN "cloudinaryPublicId" TEXT,
    ADD COLUMN "cloudinaryVersion"  INTEGER,
    ADD COLUMN "cloudinaryFolder"   TEXT,
    ADD COLUMN "cloudinaryFormat"   TEXT,
    ADD COLUMN "isPrivate"          BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX "attachment_provider_cloudinaryPublicId_idx" ON "attachment"("provider", "cloudinaryPublicId");

-- ---------------------------------------------------------------------------
-- 5. SectionBudget table
-- ---------------------------------------------------------------------------

CREATE TABLE "section_budget" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "section"          "ExpenseSection" NOT NULL,
    "period"           "BudgetPeriod" NOT NULL,
    "budgetAmount"     DECIMAL(19, 4) NOT NULL,
    "budgetCurrency"   "CurrencyCode" NOT NULL DEFAULT 'USD',
    "budgetAmountUsd"  DECIMAL(19, 4),
    "budgetAmountNpr"  DECIMAL(19, 4),
    "fxRateUsdNpr"     DECIMAL(14, 6),
    "fxRateSnapshotAt" TIMESTAMP(3),
    "periodStart"      DATE NOT NULL,
    "periodEnd"        DATE NOT NULL,
    "isActive"         BOOLEAN NOT NULL DEFAULT TRUE,
    "notes"            TEXT,
    "createdById"      UUID,
    "updatedById"      UUID,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_budget_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one budget per section + period window start
ALTER TABLE "section_budget"
    ADD CONSTRAINT "section_budget_section_period_periodStart_key"
    UNIQUE ("section", "period", "periodStart");

-- Foreign keys to user
ALTER TABLE "section_budget"
    ADD CONSTRAINT "section_budget_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "section_budget"
    ADD CONSTRAINT "section_budget_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "section_budget_section_isActive_periodStart_idx" ON "section_budget"("section", "isActive", "periodStart");
CREATE INDEX "section_budget_periodStart_periodEnd_idx"         ON "section_budget"("periodStart", "periodEnd");
CREATE INDEX "section_budget_createdById_idx"                   ON "section_budget"("createdById");
CREATE INDEX "section_budget_updatedById_idx"                   ON "section_budget"("updatedById");
