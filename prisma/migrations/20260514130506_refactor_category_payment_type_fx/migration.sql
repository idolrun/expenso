-- Migration: Remove Category, replace Source Fund with PaymentType, add FX indexes, create ExchangeRateCache
-- Generated: 2026-05-14

-- ---------------------------------------------------------------------------
-- 1. Create PaymentType enum
-- ---------------------------------------------------------------------------
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_WALLET', 'CARD', 'OTHER');

-- ---------------------------------------------------------------------------
-- 2. Add paymentType to Expense (nullable initially for safe backfill)
-- ---------------------------------------------------------------------------
ALTER TABLE "expense"
    ADD COLUMN "paymentType" "PaymentType";

-- ---------------------------------------------------------------------------
-- 3. Backfill paymentType from linked FundEntry.source
-- ---------------------------------------------------------------------------
UPDATE "expense" e
SET "paymentType" = CASE f.source
    WHEN 'BANK_TRANSFER' THEN 'BANK_TRANSFER'::"PaymentType"
    WHEN 'CASH'          THEN 'CASH'::"PaymentType"
    WHEN 'WALLET'        THEN 'MOBILE_WALLET'::"PaymentType"
    ELSE 'OTHER'::"PaymentType"
END
FROM "fund_entry" f
WHERE e."allocatedFundEntryId" = f.id;

-- For expenses without a linked fund entry, default to OTHER
UPDATE "expense"
SET "paymentType" = 'OTHER'::"PaymentType"
WHERE "paymentType" IS NULL;

-- Make paymentType non-nullable after backfill
ALTER TABLE "expense"
    ALTER COLUMN "paymentType" SET NOT NULL;

-- Default for future inserts
ALTER TABLE "expense"
    ALTER COLUMN "paymentType" SET DEFAULT 'OTHER'::"PaymentType";

-- ---------------------------------------------------------------------------
-- 4. Drop fund allocation columns from Expense
-- ---------------------------------------------------------------------------
ALTER TABLE "expense"
    DROP COLUMN IF EXISTS "allocatedFundEntryId",
    DROP COLUMN IF EXISTS "allocatedAmount";

-- ---------------------------------------------------------------------------
-- 5. Drop Category relation from Expense
-- ---------------------------------------------------------------------------
ALTER TABLE "expense"
    DROP COLUMN IF EXISTS "categoryId";

-- ---------------------------------------------------------------------------
-- 6. Drop Category table (no longer referenced)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS "category";

-- ---------------------------------------------------------------------------
-- 7. Create ExchangeRateCache table
-- ---------------------------------------------------------------------------
CREATE TABLE "exchange_rate_cache" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
    "pair"      TEXT NOT NULL,
    "rate"      DECIMAL(14, 6) NOT NULL,
    "source"    TEXT NOT NULL DEFAULT 'api',
    "cachedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exchange_rate_cache_pair_key" UNIQUE ("pair")
);

CREATE INDEX "exchange_rate_cache_pair_expiresAt_idx" ON "exchange_rate_cache"("pair", "expiresAt");

-- ---------------------------------------------------------------------------
-- 8. New indexes for multi-currency dashboard performance
-- ---------------------------------------------------------------------------
CREATE INDEX "expense_section_deletedAt_originalCurrency_idx" ON "expense"("section", "deletedAt", "originalCurrency");
CREATE INDEX "expense_fromDate_toDate_deletedAt_idx"          ON "expense"("fromDate", "toDate", "deletedAt");
CREATE INDEX "expense_amountUsd_deletedAt_idx"                ON "expense"("amountUsd", "deletedAt");
CREATE INDEX "expense_amountNpr_deletedAt_idx"                ON "expense"("amountNpr", "deletedAt");
CREATE INDEX "expense_paymentType_idx"                        ON "expense"("paymentType");

-- ---------------------------------------------------------------------------
-- 9. Drop obsolete indexes
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS "expense_categoryId_idx";
DROP INDEX IF EXISTS "expense_allocatedFundEntryId_idx";
