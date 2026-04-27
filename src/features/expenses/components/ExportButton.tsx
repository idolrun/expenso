"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportOptions, ExportRow } from "@/src/features/expenses/types/export.types";
import { exportToCSV } from "@/src/features/expenses/utils/export-csv";
import { exportToPDF } from "@/src/features/expenses/utils/export-pdf";

type ExportButtonProps = {
  rows: ExportRow[];
  section: string;
  activeFilters: Record<string, string>;
  allColumns: (keyof ExportRow)[];
};

function hasActiveFilters(activeFilters: Record<string, string>): boolean {
  return Object.values(activeFilters).some((value) => value.trim().length > 0);
}

export function ExportButton({
  rows,
  section,
  activeFilters,
  allColumns,
}: ExportButtonProps) {
  const isFiltered = hasActiveFilters(activeFilters);
  const filename = `expenses-${section}${isFiltered ? "-filtered" : ""}`;
  const exportOptions: ExportOptions = {
    filename,
    columns: allColumns,
    rows,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={rows.length === 0}>
          <Download data-icon="inline-start" />
          {isFiltered ? "Export (filtered)" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => exportToCSV(exportOptions)}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportToPDF(exportOptions)}>
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
