-- AlterTable
ALTER TABLE "account" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "passkey" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "id" DROP DEFAULT;
