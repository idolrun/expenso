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
import type {
  FundExportOptions,
  FundExportRow,
} from "@/src/features/funds/types/export.types";
import { exportFundsToCSV } from "@/src/features/funds/utils/export-csv";
import { exportFundsToPDF } from "@/src/features/funds/utils/export-pdf";

type FundExportButtonProps = {
  rows: FundExportRow[];
  activeFilters: Record<string, string>;
  allColumns: (keyof FundExportRow)[];
};

function hasActiveFilters(activeFilters: Record<string, string>): boolean {
  return Object.values(activeFilters).some((value) => value.trim().length > 0);
}

export function FundExportButton({
  rows,
  activeFilters,
  allColumns,
}: FundExportButtonProps) {
  const isFiltered = hasActiveFilters(activeFilters);
  const exportOptions: FundExportOptions = {
    filename: isFiltered ? "funds-filtered" : "funds",
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
          <DropdownMenuItem onSelect={() => exportFundsToCSV(exportOptions)}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportFundsToPDF(exportOptions)}>
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
