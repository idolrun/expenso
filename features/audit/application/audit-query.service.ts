import type { AuditLogQuery } from "@/features/audit/validation/audit-log-query";
import type { AuditLogEntryDto, PaginatedDto, ServiceResult } from "@/features/expenses/domain/dto";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { prisma } from "@/lib/prisma";
import { serializeAuditLogRow } from "@/features/expenses/domain/serialize";
import type { Prisma } from "@/generated/prisma/client";

function formatAuditMetadataValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatFundEntryLabel(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const data = metadata as Record<string, unknown>;
  const amount = formatAuditMetadataValue(data.amount);
  const currency = formatAuditMetadataValue(data.currency);
  const source = formatAuditMetadataValue(data.source)
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (amount && currency) {
    return source ? `${amount} ${currency} from ${source}` : `${amount} ${currency}`;
  }
  return source ? `Fund entry from ${source}` : null;
}

export async function listAuditLogs(
  query: AuditLogQuery,
): Promise<ServiceResult<PaginatedDto<AuditLogEntryDto>>> {
  try {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) {
      // CATEGORY_CREATED/UPDATED/DELETED are deprecated enum values; filter them out
      const deprecatedActions = ["CATEGORY_CREATED", "CATEGORY_UPDATED", "CATEGORY_DELETED"];
      if (!deprecatedActions.includes(query.action)) {
        where.action = query.action;
      }
    }
    if (query.entityType) {
      where.entityType = query.entityType;
    }

    const skip = (query.page - 1) * query.pageSize;

    const [total, rows] = await Promise.all([
      auditLogRepository.countWhere(prisma, where),
      auditLogRepository.findMany(prisma, {
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
    ]);

    const expenseIds = rows
      .filter((row) => row.entityType === "Expense")
      .map((row) => row.entityId);
    const expenses = expenseIds.length
      ? await prisma.expense.findMany({
          where: { id: { in: expenseIds } },
          select: { id: true, title: true },
        })
      : [];
    const expenseTitleById = new Map(
      expenses.map((expense) => [expense.id, expense.title]),
    );

    const items = rows.map((row) =>
      serializeAuditLogRow({
        ...row,
        entityLabel:
          row.entityType === "Expense"
            ? expenseTitleById.get(row.entityId)
            : row.entityType === "FundEntry"
              ? formatFundEntryLabel(row.metadata)
              : null,
      }),
    );

    return {
      ok: true,
      data: {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audit list failed";
    return { ok: false, error: { code: "AUDIT_LIST_FAILED", message } };
  }
}
