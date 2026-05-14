import { AuditLogPanel } from "@/components/admin/audit-log-panel";
import { requireAuth } from "@/lib/auth/guards";

export default async function AdminAuditPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Audit log
        </h1>
        <p className="text-muted-foreground text-sm">
          Visibility into security-relevant events across the system.
        </p>
      </div>
      <AuditLogPanel />
    </div>
  );
}
