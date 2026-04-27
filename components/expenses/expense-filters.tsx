"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  expenseSectionValues,
  expenseStatusValues,
  userRecordIdSchema,
} from "@/features/expenses/validation/primitives";
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const sortFields = [
  "createdAt",
  "updatedAt",
  "amount",
  "incurredOn",
  "title",
] as const;

type TagOption = { id: string; name: string; slug: string };

const controlSurface =
  "border-input bg-background text-foreground placeholder:text-muted-foreground dark:bg-input/30";

export function ExpenseFilters({
  query,
  setQuery,
  searchInput,
  setSearch,
  tags,
  hideSectionFilter,
}: {
  query: ListExpensesQuery;
  setQuery: (patch: Partial<ListExpensesQuery>) => void;
  searchInput: string;
  setSearch: (value: string) => void;
  tags: TagOption[];
  hideSectionFilter?: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [createdByDraft, setCreatedByDraft] = useState("");
  const [updatedByDraft, setUpdatedByDraft] = useState("");

  /* Sync drafts when the list query is hydrated from the URL (back/forward). */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCreatedByDraft(query.createdById ?? "");
    setUpdatedByDraft(query.updatedById ?? "");
  }, [query.createdById, query.updatedById]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selected = new Set(query.tagIds);

  const toggleTag = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setQuery({ tagIds: [...next] });
  };

  return (
    <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
      <div
        className={cn(
          "rounded-lg border border-border px-5 py-5",
          "bg-muted/40 text-foreground",
          "dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-50",
        )}
      >
        <div className="filter-row flex flex-wrap items-center gap-3">
          <Input
            id="expense-search"
            placeholder="Search…"
            aria-label="Search expenses"
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "main-search min-h-9 min-w-[min(100%,12rem)] flex-2",
              controlSurface,
            )}
          />
          {!hideSectionFilter ? (
            <NativeSelect
              aria-label="Section"
              className="min-w-[8rem] flex-1"
              value={query.section ?? ""}
              onChange={(e) =>
                setQuery({
                  section: e.target.value
                    ? (e.target.value as ListExpensesQuery["section"])
                    : undefined,
                })
              }
            >
              <NativeSelectOption value="">All sections</NativeSelectOption>
              {expenseSectionValues.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          ) : null}
          <NativeSelect
            aria-label="Status"
            className="min-w-[8rem] flex-1"
            value={query.status ?? ""}
            onChange={(e) =>
              setQuery({
                status: e.target.value
                  ? (e.target.value as ListExpensesQuery["status"])
                  : undefined,
              })
            }
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {expenseStatusValues.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <div className="flex min-w-[min(100%,14rem)] flex-1 flex-wrap gap-2">
            <NativeSelect
              aria-label="Sort by field"
              className="min-w-0 flex-1"
              value={query.sortField}
              onChange={(e) =>
                setQuery({
                  sortField: e.target.value as ListExpensesQuery["sortField"],
                })
              }
            >
              {sortFields.map((f) => (
                <NativeSelectOption key={f} value={f}>
                  {f}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <ToggleGroup
              type="single"
              value={query.sortDir}
              onValueChange={(v) => {
                if (v) setQuery({ sortDir: v as ListExpensesQuery["sortDir"] });
              }}
              variant="outline"
              spacing={0}
              className="shrink-0"
              aria-label="Sort direction"
            >
              <ToggleGroupItem value="desc" aria-label="Descending">
                Desc
              </ToggleGroupItem>
              <ToggleGroupItem value="asc" aria-label="Ascending">
                Asc
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="toggle-btn shrink-0 border border-border bg-muted px-4 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              Advanced {advancedOpen ? "−" : "+"}
            </Button>
          </CollapsibleTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch("");
              setQuery({
                section: hideSectionFilter ? query.section : undefined,
                status: undefined,
                tagIds: [],
                amountMin: undefined,
                amountMax: undefined,
                createdById: undefined,
                updatedById: undefined,
                page: 1,
              });
            }}
          >
            Reset filters
          </Button>
        </div>

        <CollapsibleContent className="overflow-hidden">
          <div
            className={cn(
              "advanced-row flex flex-wrap gap-3 border-t border-border pt-4",
              "dark:border-zinc-800",
            )}
          >
            <div className="input-group flex min-w-[min(100%,12rem)] gap-1.5">
              <Input
                id="amt-min"
                inputMode="decimal"
                placeholder="Min Amount"
                aria-label="Minimum amount"
                value={query.amountMin ?? ""}
                onChange={(e) =>
                  setQuery({ amountMin: e.target.value || undefined })
                }
                className={cn("min-h-9 min-w-0 flex-1", controlSurface)}
              />
              <Input
                id="amt-max"
                inputMode="decimal"
                placeholder="Max Amount"
                aria-label="Maximum amount"
                value={query.amountMax ?? ""}
                onChange={(e) =>
                  setQuery({ amountMax: e.target.value || undefined })
                }
                className={cn("min-h-9 min-w-0 flex-1", controlSurface)}
              />
            </div>
            <Input
              id="cb"
              inputMode="text"
              autoComplete="off"
              placeholder="User UUID (Created by)"
              aria-label="Created by user id"
              value={createdByDraft}
              onChange={(e) => setCreatedByDraft(e.target.value)}
              onBlur={() => {
                const v = createdByDraft.trim();
                if (v === "") {
                  setQuery({ createdById: undefined });
                  return;
                }
                if (userRecordIdSchema.safeParse(v).success) {
                  setQuery({ createdById: v });
                } else {
                  setCreatedByDraft(query.createdById ?? "");
                }
              }}
              className={cn(
                "min-h-9 min-w-[min(100%,16rem)] flex-1",
                controlSurface,
              )}
            />
            <Input
              id="ub"
              inputMode="text"
              autoComplete="off"
              placeholder="User UUID (Updated by)"
              aria-label="Updated by user id"
              value={updatedByDraft}
              onChange={(e) => setUpdatedByDraft(e.target.value)}
              onBlur={() => {
                const v = updatedByDraft.trim();
                if (v === "") {
                  setQuery({ updatedById: undefined });
                  return;
                }
                if (userRecordIdSchema.safeParse(v).success) {
                  setQuery({ updatedById: v });
                } else {
                  setUpdatedByDraft(query.updatedById ?? "");
                }
              }}
              className={cn(
                "min-h-9 min-w-[min(100%,16rem)] flex-1",
                controlSurface,
              )}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-9 min-w-[10rem] flex-1 justify-between font-normal",
                    controlSurface,
                  )}
                >
                  {query.tagIds.length
                    ? `${query.tagIds.length} selected`
                    : "Select tags"}
                  <CaretDownIcon className="size-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {tags.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-3 text-sm">
                      No tags.
                    </p>
                  ) : (
                    tags.map((t) => (
                      <label
                        key={t.id}
                        className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 accent-primary"
                          checked={selected.has(t.id)}
                          onChange={() => toggleTag(t.id)}
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
