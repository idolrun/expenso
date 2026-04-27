"use server";

import { revalidatePath } from "next/cache";

import { fundService } from "@/features/funds/application/fund.service";
import { createFundEntrySchema } from "@/features/funds/validation/fund";
import { requireAuth } from "@/lib/auth/guards";

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
