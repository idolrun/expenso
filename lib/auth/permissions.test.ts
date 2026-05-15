import { describe, expect, it } from "vitest";

import { UserRole } from "@/generated/prisma/client";
import { hasPermission, Permission } from "@/lib/auth/permissions";

describe("hasPermission", () => {
  it("grants USER role view-users and manage-allowed-emails", () => {
    expect(hasPermission(UserRole.USER, Permission.CAN_VIEW_USERS)).toBe(true);
    expect(
      hasPermission(UserRole.USER, Permission.CAN_MANAGE_ALLOWED_EMAILS),
    ).toBe(true);
  });

  it("grants USER role standard expense and credential access", () => {
    expect(hasPermission(UserRole.USER, Permission.CAN_READ_EXPENSE)).toBe(true);
    expect(hasPermission(UserRole.USER, Permission.CAN_READ_CREDENTIAL)).toBe(
      true,
    );
  });

  it("denies restricted permissions such as pay and manage-users", () => {
    expect(hasPermission(UserRole.USER, Permission.CAN_PAY_EXPENSE)).toBe(
      false,
    );
    expect(hasPermission(UserRole.USER, Permission.CAN_MANAGE_USERS)).toBe(
      false,
    );
  });
});
