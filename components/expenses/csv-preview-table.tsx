"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CsvPreviewTable({
  headers,
  rows,
  truncated,
}: {
  headers: string[];
  rows: string[][];
  truncated?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="max-h-48 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={`${header}-${index}`} className="whitespace-nowrap">
                  {header || `Column ${index + 1}`}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="text-muted-foreground text-center"
                >
                  No data rows
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((_, colIndex) => (
                    <TableCell key={colIndex} className="whitespace-nowrap">
                      {row[colIndex] ?? ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {truncated ? (
        <p className="text-muted-foreground text-xs">
          Showing the first {rows.length} data row{rows.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
