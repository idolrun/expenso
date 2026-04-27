export interface ExportRow {
  title: string;
  date: string;
  amount: string;
  currency: string;
  status: string;
  category: string;
  section: string;
}

export interface ExportOptions {
  filename: string;
  columns: (keyof ExportRow)[];
  rows: ExportRow[];
}
