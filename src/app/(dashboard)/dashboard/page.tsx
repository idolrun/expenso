import { UserRole } from "@/generated/prisma/client";

import { DashboardBento } from "@/components/dashboard/dashboard-bento";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDashboardSummary } from "@/features/dashboard/application/dashboard-summary.service";
import { requireAuth } from "@/lib/auth/guards";
import { parseUserRole } from "@/lib/auth/session";

export default async function DashboardHomePage() {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  const summary = await getDashboardSummary();

  if (!summary.ok) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load dashboard</AlertTitle>
        <AlertDescription>{summary.error.message}</AlertDescription>
      </Alert>
    );
  }

  return <DashboardBento data={summary.data} isAdmin={role === UserRole.ADMIN} />;
}
