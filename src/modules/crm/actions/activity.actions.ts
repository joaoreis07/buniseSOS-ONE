"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { ActivityStatus } from "@prisma/client";
import { requirePermission } from "@/shared/auth/session";
import { activityFormSchema } from "@/modules/crm/schemas/activity.schemas";
import {
  changeActivityStatusForTenant,
  createActivityForTenant,
  deleteActivityForTenant,
  updateActivityForTenant,
} from "@/modules/crm/services/activity.service";

export type ActivityActionResult = {
  ok: boolean;
  error?: string;
};

function formDataToObject(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type") || "TASK",
    status: formData.get("status") || "PENDING",
    ownerId: formData.get("ownerId"),
    dueAt: formData.get("dueAt"),
    customerId: formData.get("customerId"),
    leadId: formData.get("leadId"),
    opportunityId: formData.get("opportunityId"),
  };
}

function revalidateActivityPaths(ids?: {
  customerId?: string | null;
  leadId?: string | null;
  opportunityId?: string | null;
}) {
  revalidatePath("/app/crm/activities");
  revalidatePath("/app/crm/dashboard");
  if (ids?.customerId) revalidatePath(`/app/crm/${ids.customerId}`);
  if (ids?.leadId) revalidatePath(`/app/crm/leads/${ids.leadId}`);
  if (ids?.opportunityId) {
    revalidatePath(`/app/crm/opportunities/${ids.opportunityId}`);
  }
}

export async function createActivityAction(
  _prev: ActivityActionResult | undefined,
  formData: FormData,
): Promise<ActivityActionResult> {
  const user = await requirePermission("crm:activities:manage");
  const parsed = activityFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const activity = await createActivityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidateActivityPaths(activity);
    redirect(`/app/crm/activities/${activity.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao criar atividade",
    };
  }
}

export async function updateActivityAction(
  _prev: ActivityActionResult | undefined,
  formData: FormData,
): Promise<ActivityActionResult> {
  const user = await requirePermission("crm:activities:manage");
  const activityId = String(formData.get("activityId") || "");
  if (!activityId) return { ok: false, error: "Atividade inválida" };

  const parsed = activityFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const activity = await updateActivityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      activityId,
      data: parsed.data,
    });
    revalidateActivityPaths(activity);
    redirect(`/app/crm/activities/${activity.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao atualizar atividade",
    };
  }
}

export async function setActivityStatusAction(
  formData: FormData,
): Promise<ActivityActionResult> {
  const user = await requirePermission("crm:activities:manage");
  const activityId = String(formData.get("activityId") || "");
  const status = String(formData.get("status") || "") as ActivityStatus;
  if (!activityId || !["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
    return { ok: false, error: "Dados inválidos" };
  }

  try {
    const activity = await changeActivityStatusForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      activityId,
      status,
    });
    revalidateActivityPaths(activity);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao alterar status",
    };
  }
}

export async function deleteActivityAction(
  _prev: ActivityActionResult | undefined,
  formData: FormData,
): Promise<ActivityActionResult> {
  const user = await requirePermission("crm:activities:manage");
  const activityId = String(formData.get("activityId") || "");
  if (!activityId) return { ok: false, error: "Atividade inválida" };

  try {
    const activity = await deleteActivityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      activityId,
    });
    revalidateActivityPaths(activity);
    redirect("/app/crm/activities");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao excluir atividade",
    };
  }
}
