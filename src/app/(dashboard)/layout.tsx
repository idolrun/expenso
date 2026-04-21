import { requireAuth } from "@/lib/auth/guards";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
