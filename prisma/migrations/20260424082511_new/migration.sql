-- CreateTable
CREATE TABLE "allowed_email" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowed_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allowed_email_email_key" ON "allowed_email"("email");

-- CreateIndex
CREATE INDEX "allowed_email_email_isActive_idx" ON "allowed_email"("email", "isActive");

-- CreateIndex
CREATE INDEX "allowed_email_createdById_idx" ON "allowed_email"("createdById");

-- CreateIndex
CREATE INDEX "allowed_email_updatedById_idx" ON "allowed_email"("updatedById");

-- AddForeignKey
ALTER TABLE "allowed_email" ADD CONSTRAINT "allowed_email_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowed_email" ADD CONSTRAINT "allowed_email_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
