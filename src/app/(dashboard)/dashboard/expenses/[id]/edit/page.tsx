import { notFound } from "next/navigation";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { getExpenseById } from "@/features/expenses/application/expense-query.service";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const res = await getExpenseById(id);
  if (!res.ok) notFound();

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit expense</h1>
        <p className="text-muted-foreground text-sm">Update fields and save.</p>
      </div>
      <ExpenseForm mode="edit" expense={res.data} tags={tags} />
    </div>
  );
}
