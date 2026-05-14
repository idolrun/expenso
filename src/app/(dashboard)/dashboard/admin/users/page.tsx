import { AllowedEmailsTable } from "@/components/admin/allowed-emails-table";
import { UsersRoleTable } from "@/components/admin/users-role-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listUsersAction } from "@/features/users/actions/user-actions";
import { sessionToUserId } from "@/lib/auth/actor";
import { requireAuth } from "@/lib/auth/guards";

export default async function AdminUsersPage() {
  const session = await requireAuth();
  const res = await listUsersAction();

  if (!res.ok) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load users</AlertTitle>
        <AlertDescription>{res.error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Users
          </h1>
          <p className="text-muted-foreground text-sm">
            View team access and manage the magic-link allowlist.
          </p>
        </div>
        <UsersRoleTable
          users={res.data}
          currentUserId={sessionToUserId(session)}
          canManageRoles
        />
      </div>

      <AllowedEmailsTable
        hiddenEmail={session.user.email}
      />
    </div>
  );
}
