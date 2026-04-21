/** Parse API decimal string (e.g. expense amount) to a JS number for charts. */
export function parseApiMoneyToNumber(amount: string): number {
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
}

/** Format a number for amountMin / amountMax query params (server allows up to 4 decimal places). */
export function formatMoneyForFilterParam(value: number): string {
  const s = value.toFixed(4).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
}
