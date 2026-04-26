-- CreateEnum
CREATE TYPE "CredentialAuthMethod" AS ENUM ('EMAIL_PASSWORD', 'OAUTH_GOOGLE', 'OAUTH_GITHUB', 'OAUTH_MICROSOFT', 'OAUTH_OTHER', 'MAGIC_LINK', 'PASSKEY', 'TWO_FACTOR_EMAIL_PASSWORD', 'TWO_FACTOR_EMAIL_APP', 'SSO', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREDENTIAL_ENTRY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CREDENTIAL_ENTRY_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CREDENTIAL_ENTRY_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'CREDENTIAL_ENTRY_REENABLED';

-- CreateTable
CREATE TABLE "credential_entry" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "appUrl" TEXT,
    "loginEmail" TEXT NOT NULL,
    "password" TEXT,
    "authMethod" "CredentialAuthMethod" NOT NULL,
    "twoFactorSecret" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_history" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credential_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credential_entry_isActive_idx" ON "credential_entry"("isActive");

-- CreateIndex
CREATE INDEX "credential_entry_authMethod_idx" ON "credential_entry"("authMethod");

-- CreateIndex
CREATE INDEX "credential_entry_appName_idx" ON "credential_entry"("appName");

-- CreateIndex
CREATE INDEX "credential_entry_createdById_idx" ON "credential_entry"("createdById");

-- CreateIndex
CREATE INDEX "credential_entry_updatedById_idx" ON "credential_entry"("updatedById");

-- CreateIndex
CREATE INDEX "credential_history_entryId_changedAt_idx" ON "credential_history"("entryId", "changedAt");

-- CreateIndex
CREATE INDEX "credential_history_changedById_idx" ON "credential_history"("changedById");

-- AddForeignKey
ALTER TABLE "credential_entry" ADD CONSTRAINT "credential_entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_entry" ADD CONSTRAINT "credential_entry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_history" ADD CONSTRAINT "credential_history_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "credential_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_history" ADD CONSTRAINT "credential_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
