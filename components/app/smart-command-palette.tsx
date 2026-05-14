"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUnifiedSearch } from "@/src/features/search/hooks/use-unified-search";
import { Kbd } from "@/components/ui/kbd";
import { sectionLabel } from "@/src/lib/labels";
import { fundSourceLabel } from "@/src/lib/labels";
import {
  ReceiptIcon,
  MoneyIcon,
  KeyIcon,
  UsersIcon,
  ListIcon,
  CheckCircleIcon,
  SquaresFourIcon,
  ScrollIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

const actionIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ReceiptIcon,
  MoneyIcon,
  KeyIcon,
  UsersIcon,
  ListIcon,
  CheckCircleIcon,
  SquaresFourIcon,
  ScrollIcon,
  TrashIcon,
};

function ActionIcon({ name }: { name: string }) {
  const Icon = actionIconMap[name] ?? MagnifyingGlassIcon;
  return <Icon className="size-4 shrink-0 opacity-70" />;
}

function EntityIcon({ type }: { type: string }) {
  switch (type) {
    case "expense":
      return <ReceiptIcon className="size-4 shrink-0 text-emerald-500" />;
    case "fund":
      return <MoneyIcon className="size-4 shrink-0 text-amber-500" />;
    case "credential":
      return <KeyIcon className="size-4 shrink-0 text-violet-500" />;
    case "user":
      return <UsersIcon className="size-4 shrink-0 text-sky-500" />;
    default:
      return <FileTextIcon className="size-4 shrink-0 opacity-60" />;
  }
}

function HitSubtitle({ hit }: { hit: { type: string; matchedOn: string } }) {
  const labels: Record<string, string> = {
    title: "Title",
    notes: "Notes",
    category: "Category",
    tag: "Tag",
    note: "Note",
    source: "Source",
    name: "Name",
    url: "URL",
    username: "Username",
    email: "Email",
  };
  return <span className="text-[10px] opacity-50">Matched on {labels[hit.matchedOn] ?? hit.matchedOn}</span>;
}

export function SmartCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const { q, setQ, data, isLoading, debouncedQ, error, retry, isEmpty } = useUnifiedSearch({
    debounceMs: 280,
    limit: 20,
  });

  const page = pages[pages.length - 1];

  // Open on Cmd+K / Ctrl+K
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

  const pushPage = useCallback((newPage: string) => {
    setPages((prev) => [...prev, newPage]);
  }, []);

  const popPage = useCallback(() => {
    setPages((prev) => prev.slice(0, -1));
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
      setQ("");
      setPages([]);
    },
    [router, setQ],
  );

  // Group hits by type
  const expenseHits = data.hits.filter((h) => h.type === "expense");
  const fundHits = data.hits.filter((h) => h.type === "fund");
  const credentialHits = data.hits.filter((h) => h.type === "credential");
  const userHits = data.hits.filter((h) => h.type === "user");
  const hasHits = data.hits.length > 0;
  const hasActions = data.actions.length > 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 justify-between gap-2 px-2 max-sm:justify-center sm:w-62 sm:px-3"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <MagnifyingGlassIcon className="size-3.5" />
          <span className="hidden sm:inline">Search…</span>
        </span>
        <Kbd className="pointer-events-none hidden rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline">
          ⌘K
        </Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setQ("");
            setPages([]);
          }
        }}
        title={page ? page : "Command Palette"}
        description="Search across expenses, funds, credentials, and users. Type ? for shortcuts."
        showCloseButton
        className="top-[12%] max-w-xl"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            {pages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-2 h-7 px-2 text-xs"
                onClick={popPage}
              >
                ← Back
              </Button>
            )}
            <CommandInput
              placeholder={page ? `Search ${page}…` : "Search or type a command…"}
              value={q}
              onValueChange={setQ}
              className="flex-1"
            />
          </div>

          <CommandList className="max-h-[60vh] overflow-y-auto">
            {debouncedQ.trim().length < 2 ? (
              <>
                {/* Default view: Quick Actions */}
                {!page && (
                  <CommandGroup heading="Quick Actions">
                    {data.actions.map((action) => (
                      <CommandItem
                        key={action.id}
                        value={`action-${action.id}`}
                        onSelect={() => handleSelect(action.href)}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <ActionIcon name={action.icon} />
                          <div className="flex flex-col">
                            <span className="text-sm">{action.title}</span>
                            <span className="text-muted-foreground text-xs">{action.subtitle}</span>
                          </div>
                        </div>
                        {action.shortcut && (
                          <Kbd className="text-[10px]">{action.shortcut}</Kbd>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">
                  Type at least 2 characters to search across all records.
                </CommandEmpty>
              </>
            ) : null}

            {debouncedQ.trim().length >= 2 && isLoading ? (
              <CommandEmpty className="py-6 text-center text-sm">Searching…</CommandEmpty>
            ) : null}

            {error ? (
              <CommandEmpty className="flex flex-col gap-2 py-6 text-center">
                <span className="text-sm">{error.message}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => void retry()}>
                  Retry
                </Button>
              </CommandEmpty>
            ) : null}

            {debouncedQ.trim().length >= 2 && !isLoading && !error && isEmpty ? (
              <CommandEmpty className="py-6 text-center text-sm">No matches found.</CommandEmpty>
            ) : null}

            {/* Search Results */}
            {hasHits && debouncedQ.trim().length >= 2 && !isLoading && !error ? (
              <>
                {expenseHits.length > 0 && (
                  <CommandGroup heading={`Expenses (${expenseHits.length})`}>
                    {expenseHits.map((hit) => (
                      <CommandItem
                        key={hit.id}
                        value={`expense-${hit.id}-${hit.title}`}
                        onSelect={() => handleSelect(`/dashboard/expenses/${hit.id}`)}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <EntityIcon type="expense" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm">{hit.title}</span>
                            <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                              {sectionLabel(hit.section)} · {" "}
                              <span className="font-numeric">
                                {hit.originalAmount} {hit.originalCurrency}
                              </span>
                            </span>
                            <HitSubtitle hit={hit} />
                          </div>
                          <CaretRightIcon className="size-3.5 shrink-0 opacity-40" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {fundHits.length > 0 && (
                  <CommandGroup heading={`Fund Entries (${fundHits.length})`}>
                    {fundHits.map((hit) => (
                      <CommandItem
                        key={hit.id}
                        value={`fund-${hit.id}-${hit.title}`}
                        onSelect={() => handleSelect(`/dashboard/funds`)}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <EntityIcon type="fund" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm">{hit.title}</span>
                            <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                              {fundSourceLabel(hit.source)} · {" "}
                              <span className="font-numeric">
                                {hit.amount} {hit.currency}
                              </span>
                            </span>
                            <HitSubtitle hit={hit} />
                          </div>
                          <CaretRightIcon className="size-3.5 shrink-0 opacity-40" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {credentialHits.length > 0 && (
                  <CommandGroup heading={`Credentials (${credentialHits.length})`}>
                    {credentialHits.map((hit) => (
                      <CommandItem
                        key={hit.id}
                        value={`credential-${hit.id}-${hit.title}`}
                        onSelect={() => handleSelect(`/dashboard/credentials`)}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <EntityIcon type="credential" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm">{hit.title}</span>
                            {hit.subtitle && (
                              <span className="text-muted-foreground truncate text-xs">
                                {hit.subtitle}
                              </span>
                            )}
                            {hit.url && (
                              <span className="text-muted-foreground truncate text-xs">{hit.url}</span>
                            )}
                            <HitSubtitle hit={hit} />
                          </div>
                          <CaretRightIcon className="size-3.5 shrink-0 opacity-40" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {userHits.length > 0 && (
                  <CommandGroup heading={`Users (${userHits.length})`}>
                    {userHits.map((hit) => (
                      <CommandItem
                        key={hit.id}
                        value={`user-${hit.id}-${hit.title}`}
                        onSelect={() => handleSelect(`/dashboard/admin/users`)}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <EntityIcon type="user" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm">{hit.title}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {hit.email} · {hit.role}
                            </span>
                            <HitSubtitle hit={hit} />
                          </div>
                          <CaretRightIcon className="size-3.5 shrink-0 opacity-40" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : null}

            {/* Matching Actions */}
            {hasActions && debouncedQ.trim().length >= 2 && !isLoading && !error && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  {data.actions.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={`action-${action.id}`}
                      onSelect={() => handleSelect(action.href)}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <ActionIcon name={action.icon} />
                        <div className="flex flex-col">
                          <span className="text-sm">{action.title}</span>
                          <span className="text-muted-foreground text-xs">{action.subtitle}</span>
                        </div>
                      </div>
                      {action.shortcut && (
                        <Kbd className="text-[10px]">{action.shortcut}</Kbd>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
