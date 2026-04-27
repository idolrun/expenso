import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { FundExportOptions } from "@/src/features/funds/types/export.types";

function withPdfExtension(filename: string): string {
  return filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
}

export function exportFundsToPDF(options: FundExportOptions): void {
  const { columns, filename, rows } = options;
  const doc = new jsPDF({ orientation: "landscape" });
  const head = columns.map((column) => String(column));
  const body = rows.map((row) => columns.map((column) => row[column]));

  doc.setFontSize(16);
  doc.text(filename, 14, 15);

  autoTable(doc, {
    head: [head],
    body,
    startY: 24,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });

  doc.save(withPdfExtension(filename));
}
