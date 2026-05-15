import { describe, expect, it } from "vitest";

import {
  dashboardSectionExpensesHref,
  expenseSectionIdToRouteSlug,
  parseExpenseSectionParam,
  resolvePostCreateExpenseSectionRedirect,
} from "@/src/lib/labels";

describe("parseExpenseSectionParam", () => {
  it("parses valid section enums", () => {
    expect(parseExpenseSectionParam("PETTY_CASH")).toBe("PETTY_CASH");
    expect(parseExpenseSectionParam("  OVERVIEW  ")).toBe("OVERVIEW");
  });

  it("returns null for unknown or empty values", () => {
    expect(parseExpenseSectionParam(null)).toBeNull();
    expect(parseExpenseSectionParam("")).toBeNull();
    expect(parseExpenseSectionParam("   ")).toBeNull();
    expect(parseExpenseSectionParam("NOT_A_SECTION")).toBeNull();
  });
});

describe("expenseSectionIdToRouteSlug", () => {
  it("maps enum ids to kebab-case path slugs", () => {
    expect(expenseSectionIdToRouteSlug("PETTY_CASH")).toBe("petty-cash");
    expect(expenseSectionIdToRouteSlug("SOCIAL_MEDIA")).toBe("social-media");
    expect(expenseSectionIdToRouteSlug("SALARY")).toBe("salary");
    expect(expenseSectionIdToRouteSlug("MARKETING")).toBe("marketing");
    expect(expenseSectionIdToRouteSlug("TECH")).toBe("tech");
    expect(expenseSectionIdToRouteSlug("OVERVIEW")).toBe("overview");
    expect(expenseSectionIdToRouteSlug("TRAVEL")).toBe("travel");
  });
});

describe("dashboardSectionExpensesHref", () => {
  it("maps section to slug path and preserves section query", () => {
    expect(dashboardSectionExpensesHref("PETTY_CASH")).toBe(
      "/dashboard/sections/petty-cash?section=PETTY_CASH",
    );
    expect(dashboardSectionExpensesHref("SOCIAL_MEDIA")).toBe(
      "/dashboard/sections/social-media?section=SOCIAL_MEDIA",
    );
  });
});

describe("resolvePostCreateExpenseSectionRedirect", () => {
  it("prefers a valid URL section param over submitted section", () => {
    expect(
      resolvePostCreateExpenseSectionRedirect({
        sectionSearchParam: "PETTY_CASH",
        submittedSection: "TECH",
      }),
    ).toBe("PETTY_CASH");
  });

  it("falls back to submitted section when query is missing or invalid", () => {
    expect(
      resolvePostCreateExpenseSectionRedirect({
        sectionSearchParam: null,
        submittedSection: "TRAVEL",
      }),
    ).toBe("TRAVEL");
    expect(
      resolvePostCreateExpenseSectionRedirect({
        sectionSearchParam: "INVALID",
        submittedSection: "MARKETING",
      }),
    ).toBe("MARKETING");
  });
});
