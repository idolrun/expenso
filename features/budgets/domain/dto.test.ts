import { describe, expect, it } from "vitest";

import { thresholdFromPercent, type BudgetThreshold } from "@/features/budgets/domain/dto";

describe("thresholdFromPercent", () => {
  // Boundary: safe zone
  it("returns 'safe' for 0%", () => {
    expect(thresholdFromPercent(0)).toBe<BudgetThreshold>("safe");
  });

  it("returns 'safe' for 50%", () => {
    expect(thresholdFromPercent(50)).toBe<BudgetThreshold>("safe");
  });

  it("returns 'safe' for 89%", () => {
    expect(thresholdFromPercent(89)).toBe<BudgetThreshold>("safe");
  });

  it("returns 'safe' for 89.99%", () => {
    expect(thresholdFromPercent(89.99)).toBe<BudgetThreshold>("safe");
  });

  // Boundary: warning zone (≥90 and <100)
  it("returns 'warning' at exactly 90%", () => {
    expect(thresholdFromPercent(90)).toBe<BudgetThreshold>("warning");
  });

  it("returns 'warning' for 95%", () => {
    expect(thresholdFromPercent(95)).toBe<BudgetThreshold>("warning");
  });

  it("returns 'warning' for 99.99%", () => {
    expect(thresholdFromPercent(99.99)).toBe<BudgetThreshold>("warning");
  });

  // Boundary: danger zone (≥100)
  it("returns 'danger' at exactly 100%", () => {
    expect(thresholdFromPercent(100)).toBe<BudgetThreshold>("danger");
  });

  it("returns 'danger' at 100.01% (just over budget)", () => {
    expect(thresholdFromPercent(100.01)).toBe<BudgetThreshold>("danger");
  });

  it("returns 'danger' at 150% (significantly over budget)", () => {
    expect(thresholdFromPercent(150)).toBe<BudgetThreshold>("danger");
  });

  it("returns 'danger' at very large percentages", () => {
    expect(thresholdFromPercent(9999)).toBe<BudgetThreshold>("danger");
  });

  // Edge: negative percentages are not meaningful but should not crash.
  it("returns 'safe' for negative values (treated as 0 spend)", () => {
    expect(thresholdFromPercent(-1)).toBe<BudgetThreshold>("safe");
  });
});
