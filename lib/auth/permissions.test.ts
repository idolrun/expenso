import { describe, expect, it } from "vitest";

import { UserRole } from "@/generated/prisma/client";
import {
  canCreateExpense,
  canDeleteExpense,
  canReadExpense,
  canUpdateExpense,
  expenseCrudPermissions,
} from "@/lib/auth/permissions";

describe("expense permission helpers", () => {
  it("allows ADMIN full CRUD flags including archive", () => {
    const p = expenseCrudPermissions(UserRole.ADMIN);
    expect(p.canCreate).toBe(true);
    expect(p.canRead).toBe(true);
    expect(p.canUpdate).toBe(true);
    expect(p.canArchive).toBe(true);
    expect(p.canRestore).toBe(true);
    expect(p.canApprove).toBe(true);
    expect(p.canPay).toBe(true);
  });

  it("allows USER create/read/update/archive/restore", () => {
    const p = expenseCrudPermissions(UserRole.USER);
    expect(p.canCreate).toBe(true);
    expect(p.canRead).toBe(true);
    expect(p.canUpdate).toBe(true);
    expect(p.canArchive).toBe(true);
    expect(p.canRestore).toBe(true);
    expect(p.canApprove).toBe(false);
    expect(p.canPay).toBe(false);
  });

  it("matches granular helpers", () => {
    expect(canDeleteExpense(UserRole.ADMIN)).toBe(true);
    expect(canDeleteExpense(UserRole.USER)).toBe(true);
    expect(canCreateExpense(UserRole.USER)).toBe(true);
    expect(canReadExpense(UserRole.USER)).toBe(true);
    expect(canUpdateExpense(UserRole.USER)).toBe(true);
  });
});
