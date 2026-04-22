import type { Attachment, Prisma } from "@/app/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";

export const attachmentRepository = {
  async create(
    db: DbClient,
    data: Prisma.AttachmentCreateInput,
  ): Promise<Attachment> {
    return db.attachment.create({ data });
  },

  async findById(db: DbClient, id: string): Promise<Attachment | null> {
    return db.attachment.findUnique({ where: { id } });
  },

  /** Fetch all attachments for an expense, newest first. */
  async findByExpenseId(
    db: DbClient,
    expenseId: string,
  ): Promise<Attachment[]> {
    return db.attachment.findMany({
      where: { expenseId },
      orderBy: { createdAt: "desc" },
    });
  },

  async delete(db: DbClient, id: string): Promise<void> {
    await db.attachment.delete({ where: { id } });
  },
};
