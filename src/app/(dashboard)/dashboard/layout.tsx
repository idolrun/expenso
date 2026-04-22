import { SimpleDashboardShell } from "@/components/app/simple-dashboard-shell";
import { requireAuth } from "@/lib/auth/guards";
import { toAppUserRole } from "@/src/lib/app-user-role";
import { DisplayCurrencyProvider } from "@/src/features/display-currency/display-currency-context";

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <DisplayCurrencyProvider>
      <SimpleDashboardShell
        role={toAppUserRole(session.user.role)}
        userEmail={session.user.email ?? null}
      >
        {children}
      </SimpleDashboardShell>
    </DisplayCurrencyProvider>
  );
}
