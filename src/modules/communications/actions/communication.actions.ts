"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import {
  prepareCommunicationSchema,
  recordManualCommunicationSchema,
  templateFormSchema,
} from "@/modules/communications/schemas/communication.schemas";
import {
  cancelCommunicationForTenant,
  createTemplateForTenant,
  openPreparedCommunicationForTenant,
  prepareWhatsAppForTenant,
  recordManualCommunicationForTenant,
  setTemplateActiveForTenant,
  updateTemplateForTenant,
} from "@/modules/communications/services/communication.service";

export type CommunicationActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
  url?: string;
  claimedSent?: false;
};

function revalidateCommunications(customerId?: string | null) {
  revalidatePath("/app/communications");
  revalidatePath("/app/communications/templates");
  if (customerId) revalidatePath(`/app/crm/${customerId}`);
}

export async function saveTemplateAction(
  _prev: CommunicationActionResult | undefined,
  formData: FormData,
): Promise<CommunicationActionResult> {
  const user = await requirePermission("communications:templates");
  const templateId = String(formData.get("templateId") || "");
  const parsed = templateFormSchema.safeParse({
    name: formData.get("name"),
    channel: formData.get("channel") || "WHATSAPP",
    type: formData.get("type") || "MANUAL",
    subject: formData.get("subject"),
    body: formData.get("body"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const template = templateId
      ? await updateTemplateForTenant({
          companyId: user.companyId,
          userId: user.id,
          role: user.role,
          templateId,
          data: parsed.data,
        })
      : await createTemplateForTenant({
          companyId: user.companyId,
          userId: user.id,
          role: user.role,
          data: parsed.data,
        });
    revalidatePath("/app/communications/templates");
    redirect(`/app/communications/templates/${template.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao salvar template",
    };
  }
}

export async function toggleTemplateAction(
  _prev: CommunicationActionResult | undefined,
  formData: FormData,
): Promise<CommunicationActionResult> {
  const user = await requirePermission("communications:templates");
  const templateId = String(formData.get("templateId") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!templateId) return { ok: false, error: "Template inválido" };
  try {
    await setTemplateActiveForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      templateId,
      active,
    });
    revalidatePath("/app/communications/templates");
    revalidatePath(`/app/communications/templates/${templateId}`);
    return { ok: true, id: templateId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao atualizar template",
    };
  }
}

export async function prepareWhatsAppAction(
  _prev: CommunicationActionResult | undefined,
  formData: FormData,
): Promise<CommunicationActionResult> {
  const user = await requirePermission("communications:send");
  const parsed = prepareCommunicationSchema.safeParse({
    customerId: formData.get("customerId"),
    templateId: formData.get("templateId"),
    saleId: formData.get("saleId"),
    installmentId: formData.get("installmentId"),
    activityId: formData.get("activityId"),
    channel: formData.get("channel") || "WHATSAPP",
    type: formData.get("type") || "MANUAL",
    origin: formData.get("origin") || "MANUAL",
    subject: formData.get("subject"),
    body: formData.get("body"),
    recipient: formData.get("recipient"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const result = await prepareWhatsAppForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidateCommunications(parsed.data.customerId);
    revalidatePath(`/app/communications/${result.communication.id}`);
    return {
      ok: true,
      id: result.communication.id,
      url: result.url,
      claimedSent: false,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao preparar WhatsApp",
    };
  }
}

export async function openWhatsAppAction(
  _prev: CommunicationActionResult | undefined,
  formData: FormData,
): Promise<CommunicationActionResult> {
  const user = await requirePermission("communications:send");
  const communicationId = String(formData.get("communicationId") || "");
  if (!communicationId) return { ok: false, error: "Comunicação inválida" };
  try {
    const result = await openPreparedCommunicationForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      communicationId,
    });
    revalidatePath("/app/communications");
    revalidatePath(`/app/communications/${communicationId}`);
    return {
      ok: true,
      id: communicationId,
      url: result.url ?? undefined,
      claimedSent: false,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao abrir WhatsApp",
    };
  }
}

export async function recordManualCommunicationAction(
  _prev: CommunicationActionResult | undefined,
  formData: FormData,
): Promise<CommunicationActionResult> {
  const user = await requirePermission("communications:send");
  const parsed = recordManualCommunicationSchema.safeParse({
    customerId: formData.get("customerId"),
    channel: formData.get("channel") || "WHATSAPP",
    type: formData.get("type") || "MANUAL",
    subject: formData.get("subject"),
    body: formData.get("body"),
    recipient: formData.get("recipient"),
    activityId: formData.get("activityId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    const communication = await recordManualCommunicationForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidateCommunications(parsed.data.customerId);
    return { ok: true, id: communication.id, claimedSent: false };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao registrar comunicação",
    };
  }
}

export async function cancelCommunicationAction(
  _prev: CommunicationActionResult | undefined,
  formData: FormData,
): Promise<CommunicationActionResult> {
  const user = await requirePermission("communications:send");
  const communicationId = String(formData.get("communicationId") || "");
  if (!communicationId) return { ok: false, error: "Comunicação inválida" };
  try {
    await cancelCommunicationForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      communicationId,
    });
    revalidatePath("/app/communications");
    revalidatePath(`/app/communications/${communicationId}`);
    return { ok: true, id: communicationId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao cancelar",
    };
  }
}
