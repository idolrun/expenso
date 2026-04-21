import type { Category } from "@/app/generated/prisma/client";
import type { ExpenseSection } from "@/app/generated/prisma/client";

export interface CategoryRepositoryPort {
  findBySection(section: ExpenseSection): Promise<Category[]>;
}
