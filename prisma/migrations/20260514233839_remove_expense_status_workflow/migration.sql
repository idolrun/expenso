/*
  Warnings:

  - You are about to drop the column `status` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the `ExpenseStatus` enum. If it is still used in the database, this will fail.

*/

-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "expense_submittedById_fkey";

-- DropIndex
DROP INDEX IF EXISTS "expense_submittedById_idx";

-- AlterTable
ALTER TABLE "expense" DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "submittedAt",
DROP COLUMN IF EXISTS "submittedById";

-- DropEnum
DROP TYPE IF EXISTS "ExpenseStatus";
