import { z } from "zod";
import { CurrencyCode, FundSource } from "@/generated/prisma/enums";

export const createFundEntrySchema = z.object({
  amount: z
    .number({ message: "Amount is required" })
    .positive("Amount must be greater than 0")
    .max(999_999_999, "Amount too large"),
  currency: z.nativeEnum(CurrencyCode),
  source: z.nativeEnum(FundSource),
  sourceLabel: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  receivedAt: z.coerce.date(),
});

export const fundListQuerySchema = z.object({
  createdById: z.string().uuid().optional(),
  source: z.nativeEnum(FundSource).optional(),
  currency: z.nativeEnum(CurrencyCode).optional(),
  amountMin: z.coerce.number().nonnegative().optional(),
  amountMax: z.coerce.number().nonnegative().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateFundEntryDTO = z.infer<typeof createFundEntrySchema>;
export type FundListQueryDTO = z.infer<typeof fundListQuerySchema>;
