"use server";

import { revalidatePath } from "next/cache";

import { fundService } from "@/features/funds/application/fund.service";
import { createFundEntrySchema } from "@/features/funds/validation/fund";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function createFundEntry(formData: unknown) {
  try {
    const session = await requireAuth();
    const validated = createFundEntrySchema.parse(formData);
    const entry = await fundService.create(validated, session.user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/funds");

    return { success: true, data: entry };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add fund entry",
    };
  }
}

export async function updateFundNoteAction(
  id: string,
  note: string,
): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  try {
    const session = await requireAuth();
    const userId = session.session.userId;

    await prisma.fundEntry.update({
      where: { id },
      data: {
        note: note.trim() || null,
      },
    });

    revalidatePath("/dashboard/funds");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return { ok: false, error: { code: "UPDATE_FAILED", message } };
  }
}
