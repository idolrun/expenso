import { Prisma } from "@/app/generated/prisma";

import type {
  CurrencyCode,
  FundEntryRecord,
  FundSource,
  FundSummary,
} from "@/features/funds/domain/types";
import type { CreateFundEntryDTO, FundListQueryDTO } from "@/features/funds/validation/fund";
import { prisma } from "@/lib/prisma";

const fundEntryInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.FundEntryInclude;

type FundEntryRow = Prisma.FundEntryGetPayload<{ include: typeof fundEntryInclude }>;

function toFundEntryRecord(row: FundEntryRow): FundEntryRecord {
  return {
    id: row.id,
    amount: row.amount.toString(),
    currency: row.currency as CurrencyCode,
    source: row.source as FundSource,
    sourceLabel: row.sourceLabel,
    note: row.note,
    receivedAt: row.receivedAt,
    createdById: row.createdById,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export const fundRepository = {
  async create(
    data: CreateFundEntryDTO & { createdById: string },
  ): Promise<FundEntryRecord> {
    const row = await prisma.fundEntry.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        source: data.source,
        sourceLabel: data.sourceLabel ?? null,
        note: data.note ?? null,
        receivedAt: data.receivedAt,
        createdBy: { connect: { id: data.createdById } },
      },
      include: fundEntryInclude,
    });

    return toFundEntryRecord(row);
  },

  async findAll(
    filters: FundListQueryDTO,
  ): Promise<{ entries: FundEntryRecord[]; total: number }> {
    const where: Prisma.FundEntryWhereInput = {};

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }
    if (filters.source) {
      where.source = filters.source;
    }
    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {};
      if (filters.amountMin !== undefined) {
        where.amount.gte = new Prisma.Decimal(filters.amountMin);
      }
      if (filters.amountMax !== undefined) {
        where.amount.lte = new Prisma.Decimal(filters.amountMax);
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.receivedAt = {};
      if (filters.dateFrom) {
        where.receivedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.receivedAt.lte = filters.dateTo;
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [total, rows] = await Promise.all([
      prisma.fundEntry.count({ where }),
      prisma.fundEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
        include: fundEntryInclude,
      }),
    ]);

    return { entries: rows.map(toFundEntryRecord), total };
  },

  async findById(id: string): Promise<FundEntryRecord> {
    const row = await prisma.fundEntry.findUnique({
      where: { id },
      include: fundEntryInclude,
    });

    if (!row) {
      throw new Error("Fund entry not found");
    }

    return toFundEntryRecord(row);
  },

  async getSummary(): Promise<FundSummary> {
    const [totalsByCurrency, latestRows] = await Promise.all([
      prisma.fundEntry.groupBy({
        by: ["currency"],
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.fundEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: fundEntryInclude,
      }),
    ]);

    let totalUSD = "0";
    let totalNPR = "0";
    let entryCount = 0;

    for (const group of totalsByCurrency) {
      entryCount += group._count._all;
      if (group.currency === "USD") {
        totalUSD = group._sum.amount?.toString() ?? "0";
      }
      if (group.currency === "NPR") {
        totalNPR = group._sum.amount?.toString() ?? "0";
      }
    }

    return {
      totalUSD,
      totalNPR,
      entryCount,
      latestFive: latestRows.map(toFundEntryRecord),
    };
  },
};
