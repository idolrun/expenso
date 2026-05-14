import { requireAuth } from "@/lib/auth/guards";
import { listArchivedExpensesAction } from "@/features/expenses/actions/trash-actions";
import { TrashListClient } from "@/components/expenses/trash-list-client";

export const metadata = {
  title: "Archived Expenses | Expenso",
  description: "Review and restore archived expenses",
};

export default async function TrashPage() {
  await requireAuth();

  const result = await listArchivedExpensesAction();
  const items = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Archived Expenses
        </h1>
        <p className="text-muted-foreground text-sm">
          Review and restore archived expenses. Permanent deletion is not supported.
        </p>
      </div>
      <TrashListClient initialItems={items} />
    </div>
  );
}
