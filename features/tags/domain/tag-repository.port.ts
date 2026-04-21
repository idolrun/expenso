import type { Tag, Prisma } from "@/app/generated/prisma/client";

export interface TagRepositoryPort {
  findBySlug(slug: string): Promise<Tag | null>;
  findMany(args: Prisma.TagFindManyArgs): Promise<Tag[]>;
}
