import { notFound } from "next/navigation";

import { ExpenseListClient } from "@/components/expenses/expense-list-client";

import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { requireAuth } from "@/lib/auth/guards";
import { parseUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { flattenSearchParams } from "@/src/lib/flatten-search-params";
import { sectionFromSlug } from "@/src/lib/expense-sections";

export default async function SectionExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const role = parseUserRole(session.user.role);
  const { slug } = await params;
  const section = sectionFromSlug(slug);
  if (!section) notFound();

  const sp = flattenSearchParams(await searchParams);
  const parsed = listExpensesQuerySchema.safeParse({ ...sp, section });

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="space-y-6">
      <ExpenseListClient
        tags={tags}
        section={section}
        initialQuery={parsed.success ? parsed.data : { section }}
        title="Expenses"
        description="Filtered to this section. You can still adjust other filters."
      />
    </div>
  );
}
