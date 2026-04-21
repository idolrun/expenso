import type { SalaryRecord, Prisma } from "@/app/generated/prisma/client";

export interface SalaryRepositoryPort {
  findById(id: string): Promise<SalaryRecord | null>;
  findMany(args: Prisma.SalaryRecordFindManyArgs): Promise<SalaryRecord[]>;
}
