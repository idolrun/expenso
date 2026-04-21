import type { Prisma } from "@/app/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";

export const auditLogRepository = {
  async create(db: DbClient, data: Prisma.AuditLogCreateInput) {
    return db.auditLog.create({ data });
  },

  async findMany(
    db: DbClient,
    args: {
      where: Prisma.AuditLogWhereInput;
      orderBy: Prisma.AuditLogOrderByWithRelationInput;
      skip: number;
      take: number;
    },
  ) {
    return db.auditLog.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
      include: {
        actor: { select: { name: true, email: true } },
      },
    });
  },

  async countWhere(db: DbClient, where: Prisma.AuditLogWhereInput) {
    return db.auditLog.count({ where });
  },
};
