-- CreateEnum
CREATE TYPE "FundSource" AS ENUM ('BANK_TRANSFER', 'WALLET', 'CASH', 'CLIENT_PAYMENT', 'LOAN', 'INVESTMENT', 'GRANT', 'OTHER');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'FUNDENTRYCREATED';

-- CreateTable
CREATE TABLE "fund_entry" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "source" "FundSource" NOT NULL,
    "sourceLabel" TEXT,
    "note" TEXT,
    "receivedAt" DATE NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fund_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fund_entry_createdAt_idx" ON "fund_entry"("createdAt");

-- CreateIndex
CREATE INDEX "fund_entry_receivedAt_idx" ON "fund_entry"("receivedAt");

-- CreateIndex
CREATE INDEX "fund_entry_source_idx" ON "fund_entry"("source");

-- CreateIndex
CREATE INDEX "fund_entry_currency_idx" ON "fund_entry"("currency");

-- CreateIndex
CREATE INDEX "fund_entry_createdById_idx" ON "fund_entry"("createdById");

-- CreateIndex
CREATE INDEX "fund_entry_amount_idx" ON "fund_entry"("amount");

-- AddForeignKey
ALTER TABLE "fund_entry" ADD CONSTRAINT "fund_entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
