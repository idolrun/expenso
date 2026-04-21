import { ExpenseListClient } from "@/components/expenses/expense-list-client";
import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { flattenSearchParams } from "@/src/lib/flatten-search-params";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const sp = flattenSearchParams(await searchParams);
  const parsed = listExpensesQuerySchema.safeParse(sp);

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <ExpenseListClient
      tags={tags}
      initialQuery={parsed.success ? parsed.data : undefined}
      title="Expenses"
      description="Search, filter, and open records. Filters sync to the URL."
    />
  );
}
