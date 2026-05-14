import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { listDeletedExpensesAction } from "@/features/expenses/actions/trash-actions";
import { TrashListClient } from "@/components/expenses/trash-list-client";

export const metadata = {
  title: "Trash | Expenso",
  description: "Review and restore deleted expenses",
};

export default async function TrashPage() {
  const session = await requireRole(["ADMIN"]);
  if (!session) redirect("/dashboard");

  const result = await listDeletedExpensesAction();
  const items = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Trash
        </h1>
        <p className="text-muted-foreground text-sm">
          Review, restore, or permanently delete soft-deleted expenses.
        </p>
      </div>
      <TrashListClient initialItems={items} />
    </div>
  );
}
