import { notFound } from "next/navigation";

import { UserRole } from "@/generated/prisma/client";
import { ExpenseListClient } from "@/components/expenses/expense-list-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { requireAuth } from "@/lib/auth/guards";
import { parseUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { flattenSearchParams } from "@/src/lib/flatten-search-params";
import { sectionFromSlug, sectionLabel } from "@/src/lib/expense-sections";

export default async function SectionExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
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

  const canWrite = role === UserRole.ADMIN || role === UserRole.USER;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {sectionLabel(section)}
          </h1>
          <p className="text-muted-foreground text-sm">
            Expenses for this business area.
          </p>
        </div>
        {canWrite ? (
          <Button asChild size="sm" className="shrink-0 self-start">
            <Link href={`/dashboard/expenses/new?section=${section}`}>
              Create expense
            </Link>
          </Button>
        ) : null}
      </div>

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
