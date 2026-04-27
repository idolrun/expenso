import Papa from "papaparse";

import type { ExportOptions } from "@/src/features/expenses/types/export.types";

function withCsvExtension(filename: string): string {
  return filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
}

export function exportToCSV(options: ExportOptions): void {
  const { columns, filename, rows } = options;
  const fields = columns.map((column) => String(column));
  const data = rows.map((row) => columns.map((column) => row[column]));
  const csv = Papa.unparse({ fields, data });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = withCsvExtension(filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
