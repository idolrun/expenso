import { describe, expect, it } from "vitest";

import { UserRole } from "@/app/generated/prisma/client";
import { updateUserRoleSchema } from "@/features/users/validation/role";

describe("updateUserRoleSchema", () => {
  it("parses admin promotion", () => {
    const r = updateUserRoleSchema.safeParse({ userId: "5", role: UserRole.ADMIN });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.userId).toBe(5);
      expect(r.data.role).toBe(UserRole.ADMIN);
    }
  });

  it("rejects invalid role string", () => {
    const r = updateUserRoleSchema.safeParse({ userId: 1, role: "SUPERUSER" });
    expect(r.success).toBe(false);
  });
});
