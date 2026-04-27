import { requireAuth } from "@/lib/auth/guards";
import { fundService } from "@/features/funds/application/fund.service";
import { FundListClient } from "@/components/funds/fund-list-client";
import { AddFundButton } from "@/components/funds/fund-add-dialog";

export const metadata = {
  title: "Funds Tracker | Expenso",
  description: "Track all incoming funds and their sources",
};

export default async function FundsPage() {
  await requireAuth();

  // Phase 1 API already defaults to page 1 limit 20
  const { entries, total } = await fundService.list({ page: 1, limit: 20 });

  return (
    <div className="space-y-6 flex-1 w-full p-2 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Fund Tracker
          </h1>
          <p className="text-(--color-text-muted) text-sm mt-1">
            Track all incoming funds and their sources
          </p>
        </div>
        <AddFundButton />
      </div>

      <FundListClient initialData={{ entries, total }} />
    </div>
  );
}
