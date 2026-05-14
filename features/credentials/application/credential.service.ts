import { AuditAction, CredentialAuthMethod, UserRole } from "@/generated/prisma/client";

import type {
  CreateCredentialDTO,
  UpdateCredentialDTO,
} from "@/features/credentials/validation/credential";
import type {
  CredentialEntryRecord,
  CredentialHistoryRecord,
} from "@/features/credentials/domain/types";
import type { ServiceResult } from "@/features/expenses/domain/dto";
import { credentialRepository } from "@/features/credentials/infrastructure/credential.repository";
import { credentialHistoryRepository } from "@/features/credentials/infrastructure/credential-history.repository";
import { buildHistoryRecords } from "@/features/credentials/application/credential-history.builder";
import { auditLogRepository } from "@/features/audit/infrastructure/audit-log.repository";
import { prisma } from "@/lib/prisma";

function toServiceError(e: unknown, code: string): ServiceResult<never> {
  const message = e instanceof Error ? e.message : "Operation failed";
  return { ok: false, error: { code, message } };
}

export async function createCredentialService(
  dto: CreateCredentialDTO,
  userId: string,
): Promise<ServiceResult<CredentialEntryRecord>> {
  try {
    const entry = await prisma.$transaction(async (tx) => {
      const created = await credentialRepository.create(tx, {
        ...dto,
        createdById: userId,
      });
      await auditLogRepository.create(tx, {
        action: AuditAction.CREDENTIAL_ENTRY_CREATED,
        entityType: "CredentialEntry",
        entityId: created.id,
        actor: { connect: { id: userId } },
        metadata: { appName: created.appName, authMethod: created.authMethod },
      });
      return created;
    });
    return { ok: true, data: entry };
  } catch (e) {
    console.error("[createCredentialService]", e);
    return toServiceError(e, "CREATE_FAILED");
  }
}

export async function updateCredentialService(
  dto: UpdateCredentialDTO,
  userId: string,
): Promise<ServiceResult<CredentialEntryRecord>> {
  try {
    const existing = await credentialRepository.findById(prisma, dto.id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Credential entry not found" },
      };
    }

    const updateData: Partial<CreateCredentialDTO> & { updatedById: string } =
      {
        updatedById: userId,
      };
    if (dto.appName !== undefined) updateData.appName = dto.appName;
    if (dto.appUrl !== undefined) updateData.appUrl = dto.appUrl;
    if (dto.loginEmail !== undefined) updateData.loginEmail = dto.loginEmail;
    if (dto.password !== undefined) updateData.password = dto.password;
    if (dto.authMethod !== undefined) updateData.authMethod = dto.authMethod;
    if (dto.twoFactorSecret !== undefined)
      updateData.twoFactorSecret = dto.twoFactorSecret;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const historyRows = buildHistoryRecords(existing, updateData, userId);

    const entry = await prisma.$transaction(async (tx) => {
      const updated = await credentialRepository.update(tx, dto.id, updateData);
      if (historyRows.length) {
        await credentialHistoryRepository.createMany(tx, historyRows);
      }
      await auditLogRepository.create(tx, {
        action: AuditAction.CREDENTIAL_ENTRY_UPDATED,
        entityType: "CredentialEntry",
        entityId: updated.id,
        actor: { connect: { id: userId } },
        metadata: { fieldCount: historyRows.length },
      });
      return updated;
    });

    return { ok: true, data: entry };
  } catch (e) {
    console.error("[updateCredentialService]", e);
    return toServiceError(e, "UPDATE_FAILED");
  }
}

export async function disableCredentialService(
  id: string,
  userId: string,
): Promise<ServiceResult<CredentialEntryRecord>> {
  try {
    const existing = await credentialRepository.findById(prisma, id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Credential entry not found" },
      };
    }
    if (!existing.isActive) {
      return {
        ok: false,
        error: {
          code: "ALREADY_DISABLED",
          message: "Credential entry is already disabled",
        },
      };
    }

    const entry = await prisma.$transaction(async (tx) => {
      const updated = await credentialRepository.setActive(
        tx,
        id,
        false,
        userId,
      );
      await credentialHistoryRepository.createMany(tx, [
        {
          entryId: id,
          fieldKey: "isActive",
          oldValue: true,
          newValue: false,
          changedById: userId,
        },
      ]);
      await auditLogRepository.create(tx, {
        action: AuditAction.CREDENTIAL_ENTRY_DISABLED,
        entityType: "CredentialEntry",
        entityId: id,
        actor: { connect: { id: userId } },
        metadata: { appName: updated.appName },
      });
      return updated;
    });

    return { ok: true, data: entry };
  } catch (e) {
    console.error("[disableCredentialService]", e);
    return toServiceError(e, "DISABLE_FAILED");
  }
}

export async function reEnableCredentialService(
  id: string,
  userId: string,
): Promise<ServiceResult<CredentialEntryRecord>> {
  try {
    const existing = await credentialRepository.findById(prisma, id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Credential entry not found" },
      };
    }
    if (existing.isActive) {
      return {
        ok: false,
        error: {
          code: "ALREADY_ACTIVE",
          message: "Credential entry is already active",
        },
      };
    }

    const entry = await prisma.$transaction(async (tx) => {
      const updated = await credentialRepository.setActive(
        tx,
        id,
        true,
        userId,
      );
      await credentialHistoryRepository.createMany(tx, [
        {
          entryId: id,
          fieldKey: "isActive",
          oldValue: false,
          newValue: true,
          changedById: userId,
        },
      ]);
      await auditLogRepository.create(tx, {
        action: AuditAction.CREDENTIAL_ENTRY_REENABLED,
        entityType: "CredentialEntry",
        entityId: id,
        actor: { connect: { id: userId } },
        metadata: { appName: updated.appName },
      });
      return updated;
    });

    return { ok: true, data: entry };
  } catch (e) {
    console.error("[reEnableCredentialService]", e);
    return toServiceError(e, "REENABLE_FAILED");
  }
}

export async function listCredentialsService(filters: {
  isActive?: boolean;
  authMethod?: CredentialAuthMethod;
  search?: string;
}): Promise<ServiceResult<CredentialEntryRecord[]>> {
  try {
    const rows = await credentialRepository.findAll(prisma, filters);
    return { ok: true, data: rows };
  } catch (e) {
    console.error("[listCredentialsService]", e);
    return toServiceError(e, "LIST_FAILED");
  }
}

export async function getCredentialHistoryService(
  entryId: string,
): Promise<ServiceResult<CredentialHistoryRecord[]>> {
  try {
    const rows = await credentialHistoryRepository.findLastFiveByEntryId(
      prisma,
      entryId,
    );
    return { ok: true, data: rows };
  } catch (e) {
    console.error("[getCredentialHistoryService]", e);
    return toServiceError(e, "HISTORY_LOAD_FAILED");
  }
}
