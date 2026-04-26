import { Suspense } from "react";

import { requireAuth } from "@/lib/auth/guards";
import { listCredentialsService } from "@/features/credentials/application/credential.service";
import { CredentialTable } from "@/components/credentials/credential-table";
import { Skeleton } from "@/components/ui/skeleton";

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default async function CredentialsPage() {
  await requireAuth();
  const result = await listCredentialsService({});
  const credentials = result.ok ? result.data : [];

  return (
    <Suspense fallback={<TableSkeleton />}>
      <CredentialTable initialData={credentials} />
    </Suspense>
  );
}
