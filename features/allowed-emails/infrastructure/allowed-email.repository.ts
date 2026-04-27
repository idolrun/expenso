import type { DbClient } from "@/features/expenses/infrastructure/db.types";

export const allowedEmailRepository = {
  async list(db: DbClient) {
    return db.allowedEmail.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        note: true,
        isActive: true,
        createdById: true,
        createdBy: {
          select: { name: true, email: true },
        },
        updatedById: true,
        updatedBy: {
          select: { name: true, email: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getById(db: DbClient, id: string) {
    return db.allowedEmail.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        note: true,
        isActive: true,
        createdById: true,
        createdBy: {
          select: { name: true, email: true },
        },
        updatedById: true,
        updatedBy: {
          select: { name: true, email: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getByEmail(db: DbClient, email: string) {
    return db.allowedEmail.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async create(
    db: DbClient,
    data: {
      email: string;
      note?: string | null;
      isActive?: boolean;
      createdById?: string | null;
    },
  ) {
    return db.allowedEmail.create({
      data: {
        email: data.email,
        note: data.note ?? null,
        isActive: data.isActive ?? true,
        createdById: data.createdById ?? null,
      },
      select: {
        id: true,
        email: true,
        note: true,
        isActive: true,
        createdById: true,
        createdBy: {
          select: { name: true, email: true },
        },
        updatedById: true,
        updatedBy: {
          select: { name: true, email: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async update(
    db: DbClient,
    id: string,
    data: {
      email?: string;
      note?: string | null;
      isActive?: boolean;
      updatedById?: string | null;
    },
  ) {
    return db.allowedEmail.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedById !== undefined && { updatedById: data.updatedById }),
      },
      select: {
        id: true,
        email: true,
        note: true,
        isActive: true,
        createdById: true,
        createdBy: {
          select: { name: true, email: true },
        },
        updatedById: true,
        updatedBy: {
          select: { name: true, email: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async delete(db: DbClient, id: string) {
    return db.allowedEmail.delete({
      where: { id },
      select: { id: true },
    });
  },
};
