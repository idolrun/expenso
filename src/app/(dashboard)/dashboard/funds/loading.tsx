import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function FundsLoading() {
  return (
    <div className="space-y-6 flex-1 w-full p-4 md:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="p-4 flex flex-col md:flex-row flex-wrap items-center gap-4 bg-muted/20">
        <Skeleton className="h-10 flex-1 md:w-28" />
        <Skeleton className="h-10 flex-1 md:w-28" />
        <Skeleton className="h-10 w-full md:w-40" />
        <Skeleton className="h-10 w-full md:w-40" />
        <Skeleton className="h-10 w-full md:w-32" />
        <Skeleton className="h-10 w-full sm:w-[130px]" />
        <Skeleton className="h-10 w-full sm:w-[130px]" />
      </Card>

      <div className="overflow-x-auto rounded-lg border hidden sm:block">
        <div className="border-b bg-muted/50 p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="divide-y p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-40" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="sm:hidden space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
