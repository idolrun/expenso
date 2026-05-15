import { Suspense } from "react";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { parseExpenseSectionParam } from "@/src/lib/labels";
import type { ExpenseSectionId } from "@/src/lib/expense-sections";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const sectionParam = typeof sp.section === "string" ? sp.section : undefined;
  const defaultSection: ExpenseSectionId | undefined =
    parseExpenseSectionParam(sectionParam) ?? undefined;

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
      <Suspense
        fallback={
          <div
            className="bg-card min-h-112 rounded-xl border p-4 shadow-xs sm:p-6"
            aria-busy
            aria-label="Loading expense form"
          />
        }
      >
        <ExpenseForm
          mode="create"
          tags={tags}
          defaultSection={defaultSection}
          serverSectionSearchParam={sectionParam ?? null}
        />
      </Suspense>
    </div>
  );
}
