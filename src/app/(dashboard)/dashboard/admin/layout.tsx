import { requirePermission } from "@/lib/auth/guards";
import { Permission } from "@/lib/auth/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission(Permission.CAN_VIEW_USERS);
  return <>{children}</>;
}
