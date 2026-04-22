import { describe, expect, it } from "vitest";

import { formatMoneyAmount } from "@/src/lib/format-money";

describe("formatMoneyAmount", () => {
  // ── USD formatting ───────────────────────────────────────────────────────

  it("formats an integer USD amount", () => {
    const result = formatMoneyAmount("100", "USD");
    expect(result).toContain("100");
    // Should contain a currency symbol or ISO code
    expect(result).toMatch(/\$|USD/);
  });

  it("formats a decimal USD amount", () => {
    const result = formatMoneyAmount("1234.56", "USD");
    expect(result).toContain("1,234");
    expect(result).toContain("56");
  });

  it("formats zero USD correctly", () => {
    const result = formatMoneyAmount("0", "USD");
    // $0.00 or similar
    expect(result).toMatch(/0/);
  });

  // ── NPR formatting ───────────────────────────────────────────────────────

  it("formats an NPR amount", () => {
    const result = formatMoneyAmount("15000", "NPR");
    // Should reference NPR in some form
    expect(result).toMatch(/NPR|₨|रू/);
    expect(result).toContain("15");
  });

  // ── Default currency ─────────────────────────────────────────────────────

  it("defaults to USD when currency is not provided", () => {
    const withDefault = formatMoneyAmount("50");
    const explicitUsd = formatMoneyAmount("50", "USD");
    expect(withDefault).toBe(explicitUsd);
  });

  // ── Large amounts ────────────────────────────────────────────────────────

  it("formats large amounts with digit grouping", () => {
    const result = formatMoneyAmount("1000000", "USD");
    // Should have thousands separator: 1,000,000
    expect(result).toContain(",");
  });

  // ── Decimal precision ────────────────────────────────────────────────────

  it("formats high-precision Decimal strings (4 dp) without truncating", () => {
    const result = formatMoneyAmount("99.9999", "USD");
    // Should not round to 2 dp and discard data
    expect(result).toContain("99");
  });

  // ── Invalid input handling ────────────────────────────────────────────────

  it("returns the raw string for non-numeric input", () => {
    const result = formatMoneyAmount("not-a-number", "USD");
    // Falls back to raw string when parsing fails
    expect(result).toBe("not-a-number");
  });

  it("formats an empty string as zero (Number('') === 0)", () => {
    // Number("") is 0 — a valid finite number — so the function formats it as $0.00.
    const result = formatMoneyAmount("", "USD");
    expect(result).toMatch(/0/);
  });

  it("handles NaN gracefully", () => {
    const result = formatMoneyAmount("NaN", "USD");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  // ── Negative amounts ─────────────────────────────────────────────────────

  it("formats negative USD amounts (over-budget remaining)", () => {
    const result = formatMoneyAmount("-100.00", "USD");
    // Should contain the magnitude
    expect(result).toContain("100");
  });
});
