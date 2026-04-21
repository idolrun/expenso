-- Better Auth + Prisma: ensure primary keys get UUID defaults when the adapter
-- omits `id` (PostgreSQL + advanced.database.generateId "uuid").
-- Also restores `user.id` default if a stray local migration removed it.

ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "passkey" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
