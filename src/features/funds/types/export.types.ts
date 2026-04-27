export interface FundExportRow {
  date: string;
  source: string;
  note: string;
  addedBy: string;
  amount: string;
  currency: string;
}

export interface FundExportOptions {
  filename: string;
  columns: (keyof FundExportRow)[];
  rows: FundExportRow[];
}
