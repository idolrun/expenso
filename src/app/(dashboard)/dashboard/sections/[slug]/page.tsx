import { notFound } from "next/navigation";

import { UserRole } from "@/app/generated/prisma/client";
import { ExpenseListClient } from "@/components/expenses/expense-list-client";
import { BudgetProgressCard } from "@/components/budgets/budget-progress-card";
import { BudgetCreateSheet } from "@/components/budgets/budget-create-sheet";
import { Button } from "@/components/ui/button";
import { listExpensesQuerySchema } from "@/features/expenses/validation/expense";
import { getSectionBudgetSummaryService } from "@/features/budgets/application/budget.service";
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

  const [tags, budgetResult] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    getSectionBudgetSummaryService(section, "USD", new Date()),
  ]);

  const budgetSummary = budgetResult.ok ? budgetResult.data : null;
  const canWrite = role === UserRole.ADMIN || role === UserRole.USER;

  return (
    <div className="space-y-6">
      {/* Section budget card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {sectionLabel(section)}
          </h1>
          <p className="text-muted-foreground text-sm">
            Expenses and budget for this business area.
          </p>
        </div>
        {canWrite ? (
          <BudgetCreateSheet
            defaultSection={section}
            onCreated={undefined /* server revalidation via router.refresh in sheet */}
          >
            <Button variant="outline" size="sm" className="shrink-0 self-start">
              {budgetSummary ? "Adjust budget" : "Set budget"}
            </Button>
          </BudgetCreateSheet>
        ) : null}
      </div>

      {budgetSummary ? (
        <BudgetProgressCard summary={budgetSummary} />
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
          No active budget configured for this section.
          {canWrite ? ' Use "Set budget" to create one.' : ""}
        </p>
      )}

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
