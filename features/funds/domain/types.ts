export type FundSource =
  | "BANK_TRANSFER"
  | "WALLET"
  | "CASH"
  | "CLIENT_PAYMENT"
  | "LOAN"
  | "INVESTMENT"
  | "GRANT"
  | "OTHER";

export type CurrencyCode = "USD" | "NPR";

export interface FundEntryRecord {
  id: string;
  amount: string;
  currency: CurrencyCode;
  source: FundSource;
  sourceLabel: string | null;
  note: string | null;
  receivedAt: Date;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
}

export interface FundListFilters {
  createdById?: string;
  source?: FundSource;
  currency?: CurrencyCode;
  amountMin?: number;
  amountMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FundSummary {
  totalUSD: string;
  totalNPR: string;
  entryCount: number;
  latestFive: FundEntryRecord[];
}
