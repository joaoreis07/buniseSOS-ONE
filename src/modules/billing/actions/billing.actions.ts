"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/shared/auth/session";
import { publicErrorMessage } from "@/shared/errors/public-error";
import {
  cancelSubscriptionSchema,
  subscribeSchema,
} from "@/modules/billing/schemas/billing.schemas";
import {
  canCancelBilling,
  canManageBilling,
} from "@/modules/billing/services/access.service";
import {
  cancelSubscriptionForTenant,
  createSubscriptionForTenant,
  syncSubscriptionFromProvider,
} from "@/modules/billing/services/billing.service";

export type BillingActionResult = {
  ok: boolean;
  error?: string;
  invoiceUrl?: string | null;
};

function fail(error: unknown, fallback: string): BillingActionResult {
  return { ok: false, error: publicErrorMessage(error, fallback) };
}

export async function subscribeAction(
  _prev: BillingActionResult | undefined,
  formData: FormData,
): Promise<BillingActionResult> {
  const user = await requireSession();
  if (!canManageBilling(user.role)) {
    return { ok: false, error: "Sem permissão para gerenciar a assinatura" };
  }
  const parsed = subscribeSchema.safeParse({
    planId: formData.get("planId"),
    price: formData.get("price"),
    status: formData.get("status"),
    asaasCustomerId: formData.get("asaasCustomerId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    const subscription = await createSubscriptionForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      planId: parsed.data.planId,
    });
    revalidatePath("/app/settings/billing");
    return { ok: true, invoiceUrl: subscription.invoiceUrl };
  } catch (error) {
    revalidatePath("/app/settings/billing");
    return fail(error, "Não foi possível iniciar a cobrança");
  }
}

export async function cancelSubscriptionAction(
  _prev: BillingActionResult | undefined,
  formData: FormData,
): Promise<BillingActionResult> {
  const user = await requireSession();
  if (!canCancelBilling(user.role)) {
    return { ok: false, error: "Sem permissão para cancelar a assinatura" };
  }
  const parsed = cancelSubscriptionSchema.safeParse({
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await cancelSubscriptionForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      reason: parsed.data.reason,
    });
    revalidatePath("/app/settings/billing");
    return { ok: true };
  } catch (error) {
    return fail(error, "Não foi possível cancelar a assinatura");
  }
}

export async function syncSubscriptionAction(
  prev: BillingActionResult | undefined,
  formData: FormData,
): Promise<BillingActionResult> {
  if (formData.get("intent") !== "sync") {
    return prev ?? { ok: false, error: "Ação inválida" };
  }
  const user = await requireSession();
  if (!canManageBilling(user.role)) {
    return { ok: false, error: "Sem permissão para sincronizar a assinatura" };
  }
  try {
    await syncSubscriptionFromProvider({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
    });
    revalidatePath("/app/settings/billing");
    return { ok: true };
  } catch (error) {
    return fail(error, "Não foi possível sincronizar a assinatura");
  }
}
