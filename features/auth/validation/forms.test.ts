import { describe, expect, it } from "vitest";

import {
  magicLinkEmailSchema,
  signInSearchParamsSchema,
} from "@/features/auth/validation/forms";

describe("magicLinkEmailSchema", () => {
  it("accepts a normal email", () => {
    const r = magicLinkEmailSchema.safeParse({ email: " User@Example.com " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("User@Example.com");
    }
  });

  it("rejects malformed email", () => {
    expect(magicLinkEmailSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });
});

describe("signInSearchParamsSchema", () => {
  it("allows empty object", () => {
    expect(signInSearchParamsSchema.safeParse({}).success).toBe(true);
  });
});
