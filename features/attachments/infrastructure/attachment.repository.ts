import type { Attachment, Prisma } from "@/generated/prisma/client";

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

  /** Fetch all non-archived attachments for an expense, newest first. */
  async findActiveByExpenseId(
    db: DbClient,
    expenseId: string,
  ): Promise<Attachment[]> {
    return db.attachment.findMany({
      where: { expenseId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Fetch all attachments for an expense (including archived), newest first. */
  async findByExpenseId(
    db: DbClient,
    expenseId: string,
  ): Promise<Attachment[]> {
    return db.attachment.findMany({
      where: { expenseId },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Archive an attachment (non-destructive). Sets deletedAt timestamp. */
  async archive(db: DbClient, id: string, archivedById: string): Promise<Attachment> {
    return db.attachment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        uploadedBy: { connect: { id: archivedById } },
      },
    });
  },
};
