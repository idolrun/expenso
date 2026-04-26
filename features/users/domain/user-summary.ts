import type { UserRole } from "@/generated/prisma/client";

export type UserSummaryDto = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};
