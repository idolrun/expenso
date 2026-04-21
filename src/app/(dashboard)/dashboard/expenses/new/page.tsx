import { ExpenseForm } from "@/components/expenses/expense-form";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { sectionFromSlug } from "@/src/lib/expense-sections";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const defaultSection = from ? sectionFromSlug(from) : undefined;

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New expense</h1>
        <p className="text-muted-foreground text-sm">
          Create a record. Amounts use up to four decimal places, with live USD/NPR
          conversion cached on the server.
        </p>
      </div>
      <ExpenseForm mode="create" tags={tags} defaultSection={defaultSection ?? undefined} />
    </div>
  );
}
