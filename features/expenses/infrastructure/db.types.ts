import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export type { Prisma };
