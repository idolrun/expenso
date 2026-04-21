import { describe, expect, it } from "vitest";

import {
  flattenSearchParams,
  urlSearchParamsToNormalizedRecord,
} from "@/src/lib/search-params-normalize";

describe("flattenSearchParams", () => {
  it("preserves repeated tagIds as string[]", () => {
    expect(
      flattenSearchParams({
        tagIds: ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb"],
      }),
    ).toEqual({
      tagIds: ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb"],
    });
  });

  it("collapses single tagIds array element to string", () => {
    expect(flattenSearchParams({ tagIds: ["aaaaaaaaaaaaaaaa"] })).toEqual({
      tagIds: "aaaaaaaaaaaaaaaa",
    });
  });

  it("uses first value for duplicated scalar keys", () => {
    expect(
      flattenSearchParams({
        page: ["1", "3"],
      }),
    ).toEqual({ page: "1" });
  });

  it("omit empty tagIds-like entries", () => {
    expect(flattenSearchParams({ tagIds: [] })).toEqual({});
    expect(flattenSearchParams({ tagIds: "" })).toEqual({});
  });
});

describe("urlSearchParamsToNormalizedRecord", () => {
  it("maps repeated tagIds to string[]", () => {
    const qs = new URLSearchParams();
    qs.append("tagIds", "aaaaaaaaaaaaaaaa");
    qs.append("tagIds", "bbbbbbbbbbbbbbbb");

    expect(urlSearchParamsToNormalizedRecord(qs)).toEqual({
      tagIds: ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb"],
    });
  });

  it("maps single tagIds to string", () => {
    const qs = new URLSearchParams({ tagIds: "aaaaaaaaaaaaaaaa" });

    expect(urlSearchParamsToNormalizedRecord(qs)).toEqual({
      tagIds: "aaaaaaaaaaaaaaaa",
    });
  });

  it("uses first occurrence for duplicated scalar keys", () => {
    const qs = new URLSearchParams();
    qs.append("page", "1");
    qs.append("page", "9");

    expect(urlSearchParamsToNormalizedRecord(qs)).toEqual({ page: "1" });
  });
});
