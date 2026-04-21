export function formatMoneyAmount(amount: string, currency = "USD"): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 4,
    }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}
