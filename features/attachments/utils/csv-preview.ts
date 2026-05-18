import Papa from "papaparse";

import { resolveReceiptContentType } from "@/features/attachments/validation/attachment";

const MAX_PREVIEW_ROWS = 15;

export type CsvPreviewResult =
  | { ok: true; headers: string[]; rows: string[][]; truncated: boolean }
  | { ok: false; message: string };

export function isCsvReceiptFile(file: Pick<File, "name" | "type">): boolean {
  return resolveReceiptContentType(file) === "text/csv";
}

export function parseCsvPreviewText(text: string): CsvPreviewResult {
  if (!text.trim()) {
    return { ok: false, message: "CSV file is empty" };
  }

  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  const fatalErrors = parsed.errors.filter((error) => error.type !== "Delimiter");
  if (fatalErrors.length > 0) {
    const first = fatalErrors[0];
    return {
      ok: false,
      message: first?.message ?? "Could not parse CSV",
    };
  }

  const data = parsed.data.filter((row) =>
    row.some((cell) => String(cell ?? "").trim() !== ""),
  );

  if (data.length === 0) {
    return { ok: false, message: "CSV file is empty" };
  }

  const [headerRow, ...bodyRows] = data;
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  const columnCount = Math.max(headers.length, 1);

  const normalizedHeaders =
    headers.length > 0
      ? headers
      : Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);

  const rows = bodyRows.slice(0, MAX_PREVIEW_ROWS).map((row) =>
    Array.from({ length: columnCount }, (_, i) => String(row[i] ?? "").trim()),
  );

  return {
    ok: true,
    headers: normalizedHeaders,
    rows,
    truncated: bodyRows.length > MAX_PREVIEW_ROWS,
  };
}

export async function parseCsvPreviewFile(file: File): Promise<CsvPreviewResult> {
  try {
    const text = await file.text();
    return parseCsvPreviewText(text);
  } catch {
    return { ok: false, message: "Could not read CSV file" };
  }
}
