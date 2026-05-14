import { notFound, redirect } from "next/navigation";

import { ApprovalQueueClient } from "@/components/approvals/approval-queue-client";
import { requireRole } from "@/lib/auth/guards";
import { UserRole } from "@/generated/prisma/client";
import { listExpenses } from "@/features/expenses/application/expense-query.service";

export default async function ApprovalsPage() {
  const { role } = await requireRole([UserRole.ADMIN, UserRole.APPROVER]);

  const res = await listExpenses({
    page: 1,
    pageSize: 100,
    status: "SUBMITTED",
    tagIds: [],
    sortField: "createdAt",
    sortDir: "desc",
  });

  if (!res.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Approval Queue
          </h1>
          <p className="text-muted-foreground text-sm">
            Review and act on submitted expenses.
          </p>
        </div>
        <p className="text-destructive">Failed to load pending approvals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Approval Queue
        </h1>
        <p className="text-muted-foreground text-sm">
          Review submitted expenses and approve or reject with comments.
        </p>
      </div>
      <ApprovalQueueClient expenses={res.data.items} />
    </div>
  );
}
