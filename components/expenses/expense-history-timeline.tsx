import type { ExpenseHistoryWithExpenseDto } from "@/features/expenses/domain/dto";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJson } from "@/components/expenses/format-json-value";

export function ExpenseHistoryTimeline({
  entries,
}: {
  entries: ExpenseHistoryWithExpenseDto[];
}) {
  if (!entries.length) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No field-level changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change history</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-s border-border ps-4">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <span className="bg-background absolute -start-[5px] top-1.5 size-2 rounded-full border border-border" />
              <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {e.fieldKey}
                  </Badge>
                  <time className="text-muted-foreground text-xs">
                    {new Date(e.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="text-muted-foreground text-xs">
                  User {e.changedById.slice(0, 8)}…
                </p>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Before</p>
                    <pre className="bg-muted/60 max-h-28 overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {formatJson(e.oldValue)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">After</p>
                    <pre className="bg-muted/60 max-h-28 overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {formatJson(e.newValue)}
                    </pre>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
