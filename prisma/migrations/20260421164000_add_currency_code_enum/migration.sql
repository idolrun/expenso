-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'NPR');

-- AlterTable
ALTER TABLE "expense"
  ALTER COLUMN "currency" DROP DEFAULT,
  ALTER COLUMN "currency" TYPE "CurrencyCode" USING ("currency"::text::"CurrencyCode"),
  ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "salary_record"
  ALTER COLUMN "currency" DROP DEFAULT,
  ALTER COLUMN "currency" TYPE "CurrencyCode" USING ("currency"::text::"CurrencyCode"),
  ALTER COLUMN "currency" SET DEFAULT 'USD';
