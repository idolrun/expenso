/*
  Warnings:

  - You are about to drop the column `incurredOn` on the `expense` table. All the data in the column will be lost.
  - Added the required column `fromDate` to the `expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toDate` to the `expense` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "expense_incurredOn_idx";

-- DropIndex
DROP INDEX "expense_originalCurrency_incurredOn_deletedAt_idx";

-- AlterTable
ALTER TABLE "expense" DROP COLUMN "incurredOn",
ADD COLUMN     "fromDate" DATE NOT NULL,
ADD COLUMN     "toDate" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "expense_originalCurrency_fromDate_toDate_deletedAt_idx" ON "expense"("originalCurrency", "fromDate", "toDate", "deletedAt");

-- CreateIndex
CREATE INDEX "expense_fromDate_toDate_idx" ON "expense"("fromDate", "toDate");
