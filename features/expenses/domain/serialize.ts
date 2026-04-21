import type { Prisma } from "@/app/generated/prisma/client";

import type {
  AuditLogEntryDto,
  ExpenseDto,
  ExpenseHistoryEntryDto,
  GlobalSearchHitDto,
} from "@/features/expenses/domain/dto";

export type ExpenseRow = Prisma.ExpenseGetPayload<{
  include: {
    category: true;
    expenseTags: { include: { tag: true } };
  };
}>;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toIsoDateTime(d: Date): string {
  return d.toISOString();
}

export function serializeExpense(row: ExpenseRow): ExpenseDto {
  return {
    id: row.id,
    section: row.section,
    status: row.status,
    title: row.title,
    notes: row.notes ?? null,
    amount: row.amount.toString(),
    currency: row.currency,
    incurredOn: toIsoDate(row.incurredOn),
    categoryId: row.categoryId,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
          section: row.category.section,
        }
      : null,
    tags: row.expenseTags.map((et) => ({
      id: et.tag.id,
      name: et.tag.name,
      slug: et.tag.slug,
      color: et.tag.color ?? null,
    })),
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
    deletedAt: row.deletedAt ? toIsoDateTime(row.deletedAt) : null,
  };
}

export function serializeExpenseHistoryRow(row: {
  id: string;
  expenseId: string;
  batchId: string | null;
  fieldKey: string;
  oldValue: Prisma.JsonValue | null;
  newValue: Prisma.JsonValue | null;
  changedById: string;
  createdAt: Date;
}): ExpenseHistoryEntryDto {
  return {
    id: row.id,
    expenseId: row.expenseId,
    batchId: row.batchId,
    fieldKey: row.fieldKey,
    oldValue: row.oldValue ?? null,
    newValue: row.newValue ?? null,
    changedById: row.changedById,
    createdAt: toIsoDateTime(row.createdAt),
  };
}

export function serializeAuditLogRow(row: {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actor?: { name: string | null; email: string } | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): AuditLogEntryDto {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorId: row.actorId,
    actorLabel: row.actor?.name?.trim() || row.actor?.email || row.actorId,
    metadata: row.metadata ?? null,
    createdAt: toIsoDateTime(row.createdAt),
  };
}

export function serializeSearchHit(
  row: ExpenseRow,
  matchedOn: GlobalSearchHitDto["matchedOn"],
): GlobalSearchHitDto {
  return {
    type: "expense",
    id: row.id,
    title: row.title,
    section: row.section,
    amount: row.amount.toString(),
    currency: row.currency,
    matchedOn,
  };
}
