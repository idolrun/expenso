import { z } from "zod";

import { UserRole } from "@/app/generated/prisma/client";

/** Admin-only flows: change a user's application role (Better Auth + Prisma `User.role`). */
export const updateUserRoleSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: z.nativeEnum(UserRole),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
