import type { InventoryItem, Prisma } from "@/app/generated/prisma/client";

export interface InventoryRepositoryPort {
  findById(id: string): Promise<InventoryItem | null>;
  findMany(args: Prisma.InventoryItemFindManyArgs): Promise<InventoryItem[]>;
}
