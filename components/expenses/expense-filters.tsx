"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  expenseSectionValues,
  expenseStatusValues,
  userRecordIdSchema,
} from "@/features/expenses/validation/primitives";
import type { ListExpensesQuery } from "@/features/expenses/validation/expense";
import { CaretDownIcon, FunnelSimpleIcon } from "@phosphor-icons/react";

const sortFields = ["createdAt", "updatedAt", "amount", "incurredOn", "title"] as const;

type TagOption = { id: string; name: string; slug: string };

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
    <div className="bg-card space-y-4 rounded-xl border p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <FunnelSimpleIcon className="text-muted-foreground size-4" />
        <span className="font-heading text-sm font-medium">Filters</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label htmlFor="expense-search">Search</Label>
          <Input
            id="expense-search"
            placeholder="Title, notes, category, tags…"
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!hideSectionFilter ? (
          <div className="space-y-2">
            <Label>Section</Label>
            <NativeSelect
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
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>Status</Label>
          <NativeSelect
            value={query.status ?? ""}
            onChange={(e) =>
              setQuery({
                status: e.target.value ? (e.target.value as ListExpensesQuery["status"]) : undefined,
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
        </div>
        <div className="space-y-2">
          <Label>Sort</Label>
          <div className="flex gap-2">
            <NativeSelect
              className="flex-1"
              value={query.sortField}
              onChange={(e) =>
                setQuery({ sortField: e.target.value as ListExpensesQuery["sortField"] })
              }
            >
              {sortFields.map((f) => (
                <NativeSelectOption key={f} value={f}>
                  {f}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              className="w-24"
              value={query.sortDir}
              onChange={(e) =>
                setQuery({ sortDir: e.target.value as ListExpensesQuery["sortDir"] })
              }
            >
              <NativeSelectOption value="desc">Desc</NativeSelectOption>
              <NativeSelectOption value="asc">Asc</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="amt-min">Amount min</Label>
            <Input
              id="amt-min"
              inputMode="decimal"
              placeholder="0"
              value={query.amountMin ?? ""}
              onChange={(e) => setQuery({ amountMin: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt-max">Amount max</Label>
            <Input
              id="amt-max"
              inputMode="decimal"
              placeholder="0"
              value={query.amountMax ?? ""}
              onChange={(e) => setQuery({ amountMax: e.target.value || undefined })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="cb">Created by (user UUID)</Label>
            <Input
              id="cb"
              inputMode="text"
              autoComplete="off"
              placeholder="Paste user id…"
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ub">Updated by (user UUID)</Label>
            <Input
              id="ub"
              inputMode="text"
              autoComplete="off"
              placeholder="Paste user id…"
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
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
          <Label>Tags</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="justify-between">
                {query.tagIds.length ? `${query.tagIds.length} selected` : "Select tags"}
                <CaretDownIcon className="size-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {tags.length === 0 ? (
                  <p className="text-muted-foreground px-2 py-3 text-sm">No tags.</p>
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
      </div>
      <Separator />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            setQuery({
              section: undefined,
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
    </div>
  );
}
