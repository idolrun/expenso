export const expenseCurrencyValues = ["USD", "NPR"] as const;

export type ExpenseCurrencyCode = (typeof expenseCurrencyValues)[number];

export const defaultExpenseCurrency: ExpenseCurrencyCode = "USD";
