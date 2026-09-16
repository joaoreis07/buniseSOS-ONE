"use server";

import { publicErrorMessage } from "@/shared/errors/public-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import { leadFormSchema } from "@/modules/crm/schemas/lead.schemas";
import {
  createLeadForTenant,
  deleteLeadForTenant,
  updateLeadForTenant,
} from "@/modules/crm/services/lead.service";

export type LeadActionResult = {
  ok: boolean;
  error?: string;
  leadId?: string;
};

function formDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    origin: formData.get("origin") || "OTHER",
    status: formData.get("status") || "NEW",
    ownerId: formData.get("ownerId"),
    estimatedValue: formData.get("estimatedValue"),
    notes: formData.get("notes"),
  };
}

export async function createLeadAction(
  _prev: LeadActionResult | undefined,
  formData: FormData,
): Promise<LeadActionResult> {
  const user = await requirePermission("crm:leads:manage");
  const parsed = leadFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const lead = await createLeadForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/crm/leads");
    redirect(`/app/crm/leads/${lead.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao criar lead"),
    };
  }
}

export async function updateLeadAction(
  _prev: LeadActionResult | undefined,
  formData: FormData,
): Promise<LeadActionResult> {
  const user = await requirePermission("crm:leads:manage");
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) {
    return { ok: false, error: "Lead inválido" };
  }

  const parsed = leadFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await updateLeadForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      leadId,
      data: parsed.data,
    });
    revalidatePath("/app/crm/leads");
    revalidatePath(`/app/crm/leads/${leadId}`);
    redirect(`/app/crm/leads/${leadId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao atualizar lead"),
    };
  }
}

export async function deleteLeadAction(
  _prev: LeadActionResult | undefined,
  formData: FormData,
): Promise<LeadActionResult> {
  const user = await requirePermission("crm:leads:manage");
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) {
    return { ok: false, error: "Lead inválido" };
  }

  try {
    await deleteLeadForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      leadId,
    });
    revalidatePath("/app/crm/leads");
    redirect("/app/crm/leads");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao excluir lead"),
    };
  }
}
