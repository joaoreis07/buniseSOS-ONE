"use server";

import { publicErrorMessage } from "@/shared/errors/public-error";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/shared/auth/session";
import { moveOpportunityStage } from "@/modules/crm/services/pipeline.service";

export type PipelineActionResult = {
  ok: boolean;
  error?: string;
};

export async function moveOpportunityStageAction(
  formData: FormData,
): Promise<PipelineActionResult> {
  const user = await requirePermission("crm:pipeline:manage");
  const opportunityId = String(formData.get("opportunityId") || "");
  const stage = String(formData.get("stage") || "");

  if (!opportunityId || !stage) {
    return { ok: false, error: "Dados inválidos" };
  }

  try {
    await moveOpportunityStage({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      opportunityId,
      stage,
    });
    revalidatePath("/app/crm/pipeline");
    revalidatePath("/app/crm/opportunities");
    revalidatePath(`/app/crm/opportunities/${opportunityId}`);
    revalidatePath("/app/crm/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao mover estágio"),
    };
  }
}
