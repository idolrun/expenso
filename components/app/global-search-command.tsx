"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/src/features/search/hooks/use-global-search";

export function GlobalSearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { q, setQ, data, isLoading, debouncedQ, error, retry } = useGlobalSearch({
    debounceMs: 280,
    limit: 20,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 justify-between gap-2 px-2 max-sm:justify-center sm:w-62 sm:px-3"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted-foreground text-xs">Search</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search expenses"
        description="Find expenses by title, notes, category, or tags."
        showCloseButton
        className="top-[15%] max-w-lg"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search expenses…"
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            {debouncedQ.trim().length < 2 ? (
              <CommandEmpty>Type at least 2 characters.</CommandEmpty>
            ) : null}
            {debouncedQ.trim().length >= 2 && isLoading ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : null}
            {error ? (
              <CommandEmpty className="flex flex-col gap-2">
                <span>{error.message}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => void retry()}>
                  Retry
                </Button>
              </CommandEmpty>
            ) : null}
            {debouncedQ.trim().length >= 2 && !isLoading && !error && data.length === 0 ? (
              <CommandEmpty>No matches.</CommandEmpty>
            ) : null}
            <CommandGroup heading="Expenses">
              {data.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`${hit.id}-${hit.title}`}
                  onSelect={() => {
                    router.push(`/dashboard/expenses/${hit.id}`);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{hit.title}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {hit.section.replaceAll("_", " ")} ·{" "}
                      <span className="font-numeric">{hit.originalAmount}</span> {hit.originalCurrency}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
