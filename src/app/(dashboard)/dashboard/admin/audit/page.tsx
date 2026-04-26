import { AuditLogPanel } from "@/components/admin/audit-log-panel";
import { requireRole } from "@/lib/auth/guards";
import { UserRole } from "@/generated/prisma/client";

export default async function AdminAuditPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Audit log
        </h1>
        <p className="text-muted-foreground text-sm">
          Administrative visibility into security-relevant events.
        </p>
      </div>
      <AuditLogPanel />
    </div>
  );
}
