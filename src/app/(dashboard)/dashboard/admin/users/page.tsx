import { AllowedEmailsTable } from "@/components/admin/allowed-emails-table";
import { UsersRoleTable } from "@/components/admin/users-role-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listUsersAction } from "@/features/users/actions/user-actions";
import { sessionToUserId } from "@/lib/auth/actor";
import { requireRole } from "@/lib/auth/guards";
import { UserRole } from "@/generated/prisma/client";

export default async function AdminUsersPage() {
  const { session, role } = await requireRole([UserRole.ADMIN, UserRole.USER]);
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
      {role === UserRole.ADMIN ? (
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Users
            </h1>
            <p className="text-muted-foreground text-sm">
              View team access and manage the magic-link allowlist. Role changes
              are admin-only.
            </p>
          </div>
          <UsersRoleTable
            users={res.data}
            currentUserId={sessionToUserId(session)}
            canManageRoles
          />
        </div>
      ) : null}

      <AllowedEmailsTable
        canManageEntries={role === UserRole.ADMIN}
        hiddenEmail={session.user.email}
      />
    </div>
  );
}
