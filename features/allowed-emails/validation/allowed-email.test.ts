import { describe, expect, it } from "vitest";

import {
  createAllowedEmailSchema,
  updateAllowedEmailSchema,
  deactivateAllowedEmailSchema,
} from "@/features/allowed-emails/validation/allowed-email";

describe("createAllowedEmailSchema", () => {
  it("accepts a valid email with defaults", () => {
    const r = createAllowedEmailSchema.safeParse({ email: "Test@Example.com" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("test@example.com");
      expect(r.data.isActive).toBe(true);
      expect(r.data.note).toBeUndefined();
    }
  });

  it("accepts email with note and inactive", () => {
    const r = createAllowedEmailSchema.safeParse({
      email: "user@company.com",
      note: "Engineering team",
      isActive: false,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.note).toBe("Engineering team");
      expect(r.data.isActive).toBe(false);
    }
  });

  it("rejects invalid email", () => {
    const r = createAllowedEmailSchema.safeParse({ email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects empty email", () => {
    const r = createAllowedEmailSchema.safeParse({ email: "   " });
    expect(r.success).toBe(false);
  });

  it("rejects note over 255 chars", () => {
    const r = createAllowedEmailSchema.safeParse({
      email: "a@b.com",
      note: "a".repeat(256),
    });
    expect(r.success).toBe(false);
  });
});

describe("updateAllowedEmailSchema", () => {
  it("accepts a valid update", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const r = updateAllowedEmailSchema.safeParse({
      id,
      email: "User@Example.COM",
      note: "Updated",
      isActive: true,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.id).toBe(id);
      expect(r.data.email).toBe("user@example.com");
    }
  });

  it("rejects invalid uuid", () => {
    const r = updateAllowedEmailSchema.safeParse({
      id: "not-a-uuid",
      email: "user@example.com",
      note: "",
      isActive: false,
    });
    expect(r.success).toBe(false);
  });
});

describe("deactivateAllowedEmailSchema", () => {
  it("accepts a valid uuid", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const r = deactivateAllowedEmailSchema.safeParse({ id });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.id).toBe(id);
    }
  });

  it("rejects invalid uuid", () => {
    const r = deactivateAllowedEmailSchema.safeParse({ id: "bad-id" });
    expect(r.success).toBe(false);
  });
});
