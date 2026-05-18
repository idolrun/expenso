import { describe, expect, it } from "vitest";

import {
  parseCsvPreviewText,
  parseCsvPreviewFile,
} from "@/features/attachments/utils/csv-preview";

describe("parseCsvPreviewText", () => {
  it("parses headers and rows", () => {
    const result = parseCsvPreviewText("name,amount\nCoffee,4.50\nTaxi,12");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.headers).toEqual(["name", "amount"]);
    expect(result.rows).toEqual([
      ["Coffee", "4.50"],
      ["Taxi", "12"],
    ]);
    expect(result.truncated).toBe(false);
  });

  it("returns an error for empty CSV", () => {
    const result = parseCsvPreviewText("\n\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/empty/i);
  });
});

describe("parseCsvPreviewFile", () => {
  it("reads file contents", async () => {
    const file = new File(["item,qty\nPen,2"], "items.csv", {
      type: "text/csv",
    });
    const result = await parseCsvPreviewFile(file);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.headers).toEqual(["item", "qty"]);
    expect(result.rows).toEqual([["Pen", "2"]]);
  });
});
