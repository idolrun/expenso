import type { Prisma } from "@/generated/prisma/client";
import { CredentialAuthMethod } from "@/generated/prisma/client";

import type { DbClient } from "@/features/expenses/infrastructure/db.types";
import type { CreateCredentialDTO } from "@/features/credentials/validation/credential";
import type { CredentialEntryRecord } from "@/features/credentials/domain/types";

const entryInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CredentialEntryInclude;

function toRecord(
  row: Prisma.CredentialEntryGetPayload<{ include: typeof entryInclude }>,
): CredentialEntryRecord {
  return {
    id: row.id,
    appName: row.appName,
    appUrl: row.appUrl,
    loginEmail: row.loginEmail,
    password: row.password,
    authMethod: row.authMethod as CredentialEntryRecord["authMethod"],
    twoFactorSecret: row.twoFactorSecret,
    notes: row.notes,
    isActive: row.isActive,
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export const credentialRepository = {
  async findAll(
    db: DbClient,
    filters: {
      isActive?: boolean;
      authMethod?: CredentialAuthMethod;
      search?: string;
    },
  ): Promise<CredentialEntryRecord[]> {
    const where: Prisma.CredentialEntryWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.authMethod !== undefined) {
      where.authMethod = filters.authMethod;
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { appName: { contains: q, mode: "insensitive" } },
        { loginEmail: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await db.credentialEntry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: entryInclude,
    });

    return rows.map(toRecord);
  },

  async findById(
    db: DbClient,
    id: string,
  ): Promise<CredentialEntryRecord | null> {
    const row = await db.credentialEntry.findUnique({
      where: { id },
      include: entryInclude,
    });
    if (!row) return null;
    return toRecord(row);
  },

  async create(
    db: DbClient,
    data: CreateCredentialDTO & { createdById: string },
  ): Promise<CredentialEntryRecord> {
    const row = await db.credentialEntry.create({
      data: {
        appName: data.appName,
        appUrl: data.appUrl || null,
        loginEmail: data.loginEmail,
        password: data.password || null,
        authMethod: data.authMethod,
        twoFactorSecret: data.twoFactorSecret || null,
        notes: data.notes || null,
        createdBy: { connect: { id: data.createdById } },
        updatedBy: { connect: { id: data.createdById } },
      },
      include: entryInclude,
    });
    return toRecord(row);
  },

  async update(
    db: DbClient,
    id: string,
    data: Partial<CreateCredentialDTO> & { updatedById: string },
  ): Promise<CredentialEntryRecord> {
    const updateData: Prisma.CredentialEntryUpdateInput = {
      updatedBy: { connect: { id: data.updatedById } },
    };

    if (data.appName !== undefined) updateData.appName = data.appName;
    if (data.appUrl !== undefined) updateData.appUrl = data.appUrl || null;
    if (data.loginEmail !== undefined) updateData.loginEmail = data.loginEmail;
    if (data.password !== undefined) updateData.password = data.password || null;
    if (data.authMethod !== undefined) updateData.authMethod = data.authMethod;
    if (data.twoFactorSecret !== undefined)
      updateData.twoFactorSecret = data.twoFactorSecret || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const row = await db.credentialEntry.update({
      where: { id },
      data: updateData,
      include: entryInclude,
    });
    return toRecord(row);
  },

  async setActive(
    db: DbClient,
    id: string,
    isActive: boolean,
    updatedById: string,
  ): Promise<CredentialEntryRecord> {
    const row = await db.credentialEntry.update({
      where: { id },
      data: {
        isActive,
        updatedBy: { connect: { id: updatedById } },
      },
      include: entryInclude,
    });
    return toRecord(row);
  },
};
