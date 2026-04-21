import { z } from "zod";

import { UserRole } from "@/app/generated/prisma/client";

import { userRecordIdSchema } from "@/features/expenses/validation/primitives";

/** Admin-only flows: change a user's application role (Better Auth + Prisma `User.role`). */
export const updateUserRoleSchema = z.object({
  userId: userRecordIdSchema,
  role: z.nativeEnum(UserRole),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
