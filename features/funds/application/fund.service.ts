import { AuditAction } from "@/generated/prisma/enums";

import type {
  FundEntryRecord,
  FundSummary,
} from "@/features/funds/domain/types";
import { fundRepository } from "@/features/funds/infrastructure/fund.repository";
import type { CreateFundEntryDTO, FundListQueryDTO } from "@/features/funds/validation/fund";
import { prisma } from "@/lib/prisma";

export const fundService = {
  async create(dto: CreateFundEntryDTO, userId: string): Promise<FundEntryRecord> {
    try {
      const entry = await fundRepository.create({ ...dto, createdById: userId });

      await prisma.auditLog.create({
        data: {
          action: AuditAction.FUNDENTRYCREATED,
          entityType: "FundEntry",
          entityId: entry.id,
          actorId: userId,
          metadata: {
            amount: dto.amount,
            currency: dto.currency,
            source: dto.source,
          },
        },
      });

      return entry;
    } catch (error) {
      console.error("[fundService.create]", error);
      throw new Error("Failed to create fund entry");
    }
  },

  async list(
    filters: FundListQueryDTO,
  ): Promise<{ entries: FundEntryRecord[]; total: number }> {
    try {
      return await fundRepository.findAll(filters);
    } catch (error) {
      console.error("[fundService.list]", error);
      throw new Error("Failed to list fund entries");
    }
  },

  async getById(id: string): Promise<FundEntryRecord> {
    try {
      return await fundRepository.findById(id);
    } catch (error) {
      console.error("[fundService.getById]", error);
      if (error instanceof Error && error.message === "Fund entry not found") {
        throw error;
      }
      throw new Error("Failed to get fund entry");
    }
  },

  async getSummary(): Promise<FundSummary> {
    try {
      return await fundRepository.getSummary();
    } catch (error) {
      console.error("[fundService.getSummary]", error);
      throw new Error("Failed to load fund summary");
    }
  },
};
