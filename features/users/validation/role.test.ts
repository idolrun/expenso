import { describe, expect, it } from "vitest";

import { UserRole } from "@/generated/prisma/client";
import { updateUserRoleSchema } from "@/features/users/validation/role";

describe("updateUserRoleSchema", () => {
  it("parses admin promotion", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const r = updateUserRoleSchema.safeParse({ userId: id, role: UserRole.USER });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.userId).toBe(id);
      expect(r.data.role).toBe(UserRole.USER);
    }
  });

  it("rejects invalid role string", () => {
    const r = updateUserRoleSchema.safeParse({
      userId: "00000000-0000-4000-8000-000000000001",
      role: "SUPERUSER",
    });
    expect(r.success).toBe(false);
  });
});
