import { SimpleDashboardShell } from "@/components/app/simple-dashboard-shell";
import { requireAuth } from "@/lib/auth/guards";
import { toAppUserRole } from "@/src/lib/app-user-role";
import { DisplayCurrencyProvider } from "@/src/features/display-currency/display-currency-context";
import { getPendingApprovalCount } from "@/features/expenses/actions/pending-approval-count";

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const pendingApprovalCount = await getPendingApprovalCount();

  return (
    <DisplayCurrencyProvider>
      <SimpleDashboardShell
        role={toAppUserRole(session.user.role)}
        userEmail={session.user.email ?? null}
        pendingApprovalCount={pendingApprovalCount}
      >
        {children}
      </SimpleDashboardShell>
    </DisplayCurrencyProvider>
  );
}
