"use server";

import { publicErrorMessage } from "@/shared/errors/public-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import { opportunityFormSchema } from "@/modules/crm/schemas/opportunity.schemas";
import {
  createOpportunityForTenant,
  deleteOpportunityForTenant,
  updateOpportunityForTenant,
} from "@/modules/crm/services/opportunity.service";

export type OpportunityActionResult = {
  ok: boolean;
  error?: string;
  opportunityId?: string;
};

function formDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    leadId: formData.get("leadId"),
    customerId: formData.get("customerId"),
    ownerId: formData.get("ownerId"),
    stage: formData.get("stage") || "NEW",
    estimatedValue: formData.get("estimatedValue"),
    probability: formData.get("probability"),
    expectedCloseDate: formData.get("expectedCloseDate"),
    notes: formData.get("notes"),
  };
}

export async function createOpportunityAction(
  _prev: OpportunityActionResult | undefined,
  formData: FormData,
): Promise<OpportunityActionResult> {
  const user = await requirePermission("crm:opportunities:manage");
  const parsed = opportunityFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const opportunity = await createOpportunityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/crm/opportunities");
    redirect(`/app/crm/opportunities/${opportunity.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        publicErrorMessage(error, "Falha ao criar oportunidade"),
    };
  }
}

export async function updateOpportunityAction(
  _prev: OpportunityActionResult | undefined,
  formData: FormData,
): Promise<OpportunityActionResult> {
  const user = await requirePermission("crm:opportunities:manage");
  const opportunityId = String(formData.get("opportunityId") || "");
  if (!opportunityId) {
    return { ok: false, error: "Oportunidade inválida" };
  }

  const parsed = opportunityFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await updateOpportunityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      opportunityId,
      data: parsed.data,
    });
    revalidatePath("/app/crm/opportunities");
    revalidatePath(`/app/crm/opportunities/${opportunityId}`);
    redirect(`/app/crm/opportunities/${opportunityId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao atualizar oportunidade",
    };
  }
}

export async function deleteOpportunityAction(
  _prev: OpportunityActionResult | undefined,
  formData: FormData,
): Promise<OpportunityActionResult> {
  const user = await requirePermission("crm:opportunities:manage");
  const opportunityId = String(formData.get("opportunityId") || "");
  if (!opportunityId) {
    return { ok: false, error: "Oportunidade inválida" };
  }

  try {
    await deleteOpportunityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      opportunityId,
    });
    revalidatePath("/app/crm/opportunities");
    redirect("/app/crm/opportunities");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao excluir oportunidade",
    };
  }
}
