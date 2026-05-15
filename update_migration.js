const fs = require('fs');
const path = 'prisma/migrations/20260514173745_remove_approval_feat/migration.sql';
let content = fs.readFileSync(path, 'utf8');

const prefix = `
-- Update data before enum change
UPDATE "audit_log" SET "action" = 'OTHER' WHERE "action" IN ('EXPENSE_APPROVED', 'EXPENSE_REJECTED');
UPDATE "expense" SET "status" = 'SUBMITTED' WHERE "status" IN ('APPROVED', 'REJECTED');
UPDATE "user" SET "role" = 'USER' WHERE "role" IN ('ADMIN', 'APPROVER');

`;

content = content.replace('-- AlterEnum', prefix + '-- AlterEnum');
fs.writeFileSync(path, content);
