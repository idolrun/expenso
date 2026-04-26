import type { AuditLogQuery } from "@/features/audit/validation/audit-log-query";
import type { AuditLogEntryDto, PaginatedDto, ServiceResult } from "@/features/expenses/domain/dto";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { prisma } from "@/lib/prisma";
import { serializeAuditLogRow } from "@/features/expenses/domain/serialize";
import type { Prisma } from "@/generated/prisma/client";

export async function listAuditLogs(
  query: AuditLogQuery,
): Promise<ServiceResult<PaginatedDto<AuditLogEntryDto>>> {
  try {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) {
      where.action = query.action;
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

    return {
      ok: true,
      data: {
        items: rows.map(serializeAuditLogRow),
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
