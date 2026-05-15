export interface ExportRow {
  id?: string;
  title: string;
  date: string;
  amount: string;
  currency: string;
  paymentType: string;
  section: string;
}

export interface ExportOptions {
  filename: string;
  columns: (keyof ExportRow)[];
  rows: ExportRow[];
}
