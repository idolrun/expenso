"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function FundsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Funds error boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h2 className="text-xl font-semibold">Unable to load funds</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Something went wrong while displaying the fund tracker. You can try
        again or reload the page.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
      {error.digest ? (
        <p className="text-muted-foreground text-xs">Error ID: {error.digest}</p>
      ) : null}
    </div>
  );
}
