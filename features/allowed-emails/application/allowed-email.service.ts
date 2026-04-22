import type { ServiceResult } from "@/features/expenses/domain/dto";
import type { AllowedEmailDto } from "@/features/allowed-emails/domain/allowed-email";
import { allowedEmailRepository } from "@/features/allowed-emails/infrastructure/allowed-email.repository";
import {
  createAllowedEmailSchema,
  updateAllowedEmailSchema,
  deleteAllowedEmailSchema,
} from "@/features/allowed-emails/validation/allowed-email";
import { prisma } from "@/lib/prisma";

function toDto(row: {
  id: string;
  email: string;
  note: string | null;
  isActive: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AllowedEmailDto {
  return {
    id: row.id,
    email: row.email,
    note: row.note,
    isActive: row.isActive,
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAllowedEmails(): Promise<
  ServiceResult<AllowedEmailDto[]>
> {
  try {
    const rows = await allowedEmailRepository.list(prisma);
    return { ok: true, data: rows.map(toDto) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list allowed emails";
    return { ok: false, error: { code: "LIST_FAILED", message } };
  }
}

export async function createAllowedEmail(
  actorUserId: string,
  raw: unknown,
): Promise<ServiceResult<AllowedEmailDto>> {
  const parsed = createAllowedEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const { email, note, isActive } = parsed.data;

  try {
    const existing = await allowedEmailRepository.getByEmail(prisma, email);
    if (existing) {
      return {
        ok: false,
        error: { code: "DUPLICATE_EMAIL", message: "This email is already in the allowlist." },
      };
    }

    const row = await allowedEmailRepository.create(prisma, {
      email,
      note: note || null,
      isActive,
      createdById: actorUserId,
    });
    return { ok: true, data: toDto(row) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create allowed email";
    return { ok: false, error: { code: "CREATE_FAILED", message } };
  }
}

export async function updateAllowedEmail(
  actorUserId: string,
  raw: unknown,
): Promise<ServiceResult<AllowedEmailDto>> {
  const parsed = updateAllowedEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const { id, email, note, isActive } = parsed.data;

  try {
    const existing = await allowedEmailRepository.getById(prisma, id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Allowed email not found." },
      };
    }

    if (email !== existing.email) {
      const duplicate = await allowedEmailRepository.getByEmail(prisma, email);
      if (duplicate && duplicate.id !== id) {
        return {
          ok: false,
          error: { code: "DUPLICATE_EMAIL", message: "This email is already in the allowlist." },
        };
      }
    }

    const row = await allowedEmailRepository.update(prisma, id, {
      email,
      note: note || null,
      isActive,
      updatedById: actorUserId,
    });
    return { ok: true, data: toDto(row) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update allowed email";
    return { ok: false, error: { code: "UPDATE_FAILED", message } };
  }
}

export async function deleteAllowedEmail(
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const parsed = deleteAllowedEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const { id } = parsed.data;

  try {
    await allowedEmailRepository.delete(prisma, id);
    return { ok: true, data: { id } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete allowed email";
    return { ok: false, error: { code: "DELETE_FAILED", message } };
  }
}
