import { requireRole } from "@/lib/auth/guards";
import { UserRole } from "@/generated/prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole([UserRole.ADMIN]);
  return <>{children}</>;
}
