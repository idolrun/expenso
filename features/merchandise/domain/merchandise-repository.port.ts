import type { MerchandiseItem, Prisma } from "@/app/generated/prisma/client";

export interface MerchandiseRepositoryPort {
  findById(id: string): Promise<MerchandiseItem | null>;
  findMany(args: Prisma.MerchandiseItemFindManyArgs): Promise<MerchandiseItem[]>;
}
