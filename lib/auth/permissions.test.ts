import { describe, expect, it } from "vitest";

import { UserRole } from "@/app/generated/prisma/client";
import {
  canCreateExpense,
  canDeleteExpense,
  canReadExpense,
  canUpdateExpense,
  expenseCrudPermissions,
} from "@/lib/auth/permissions";

describe("expense permission helpers", () => {
  it("allows ADMIN full CRUD flags", () => {
    const p = expenseCrudPermissions(UserRole.ADMIN);
    expect(p).toEqual({
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    });
  });

  it("allows USER create/read/update but not delete", () => {
    const p = expenseCrudPermissions(UserRole.USER);
    expect(p.canCreate && p.canRead && p.canUpdate).toBe(true);
    expect(p.canDelete).toBe(false);
  });

  it("matches granular helpers", () => {
    expect(canDeleteExpense(UserRole.ADMIN)).toBe(true);
    expect(canDeleteExpense(UserRole.USER)).toBe(false);
    expect(canCreateExpense(UserRole.USER)).toBe(true);
    expect(canReadExpense(UserRole.USER)).toBe(true);
    expect(canUpdateExpense(UserRole.USER)).toBe(true);
  });
});
