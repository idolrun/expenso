import { SimpleDashboardShell } from "@/components/app/simple-dashboard-shell";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission, Permission } from "@/lib/auth/permissions";
import { parseUserRole } from "@/lib/auth/session";
import { toAppUserRole } from "@/src/lib/app-user-role";
import { DisplayCurrencyProvider } from "@/src/features/display-currency/display-currency-context";

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const role = parseUserRole(session.user.role);
  const showUsers = hasPermission(role, Permission.CAN_VIEW_USERS);

  return (
    <DisplayCurrencyProvider>
      <SimpleDashboardShell
        role={toAppUserRole(session.user.role)}
        userEmail={session.user.email ?? null}
        showUsers={showUsers}
      >
        {children}
      </SimpleDashboardShell>
    </DisplayCurrencyProvider>
  );
}
