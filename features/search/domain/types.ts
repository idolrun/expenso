import type { ExpenseCurrencyCode } from "@/features/expenses/domain/currency";

export type SearchEntityType = "expense" | "fund" | "credential" | "user" | "action";

export type UnifiedSearchHit =
  | {
      type: "expense";
      id: string;
      title: string;
      section: string;
      originalAmount: string;
      originalCurrency: ExpenseCurrencyCode;
      matchedOn: "title" | "notes" | "category" | "tag";
    }
  | {
      type: "fund";
      id: string;
      title: string;
      subtitle: string;
      source: string;
      amount: string;
      currency: string;
      matchedOn: "note" | "source";
    }
  | {
      type: "credential";
      id: string;
      title: string;
      subtitle: string;
      url: string | null;
      matchedOn: "name" | "url" | "username";
    }
  | {
      type: "user";
      id: string;
      title: string;
      subtitle: string;
      email: string;
      role: string;
      matchedOn: "name" | "email";
    };

export type QuickAction = {
  type: "action";
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  shortcut?: string;
};

export type UnifiedSearchResult = {
  query: string;
  hits: UnifiedSearchHit[];
  actions: QuickAction[];
};

export type UnifiedSearchQuery = {
  q: string;
  limit?: number;
};
