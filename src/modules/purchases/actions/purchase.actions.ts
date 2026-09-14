"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireSession } from "@/shared/auth/session";
import { purchaseFormSchema } from "@/modules/purchases/schemas/purchase.schemas";
import {
  canCancelPurchases,
  canCreatePurchases,
  canReceivePurchases,
  cancelPurchaseForTenant,
  createPurchaseForTenant,
  receivePurchaseForTenant,
  updateDraftPurchaseForTenant,
} from "@/modules/purchases/services/purchase.service";

export type PurchaseActionResult = {
  ok: boolean;
  error?: string;
};

function parseItems(formData: FormData) {
  try {
    return JSON.parse(String(formData.get("items") || "[]")) as unknown;
  } catch {
    return [];
  }
}

function parsePurchaseForm(formData: FormData) {
  return purchaseFormSchema.safeParse({
    supplierId: formData.get("supplierId"),
    discountAmount: formData.get("discountAmount") || 0,
    notes: formData.get("notes"),
    items: parseItems(formData),
  });
}

function revalidatePurchasePaths(purchaseId?: string) {
  revalidatePath("/app/purchases");
  revalidatePath("/app/inventory");
  revalidatePath("/app/suppliers");
  if (purchaseId) revalidatePath(`/app/purchases/${purchaseId}`);
}

export async function createPurchaseAction(
  _prev: PurchaseActionResult | undefined,
  formData: FormData,
): Promise<PurchaseActionResult> {
  const user = await requireSession();
  if (!canCreatePurchases(user.role)) {
    return { ok: false, error: "Sem permissão para registrar compras" };
  }
  const parsed = parsePurchaseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const receive = String(formData.get("intent") || "") === "receive";
  if (receive && !canReceivePurchases(user.role)) {
    return { ok: false, error: "Sem permissão para receber compras" };
  }
  try {
    const purchase = await createPurchaseForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
      receive,
    });
    revalidatePurchasePaths(purchase.id);
    redirect(`/app/purchases/${purchase.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao registrar compra",
    };
  }
}

export async function updatePurchaseAction(
  _prev: PurchaseActionResult | undefined,
  formData: FormData,
): Promise<PurchaseActionResult> {
  const user = await requireSession();
  if (!canCreatePurchases(user.role)) {
    return { ok: false, error: "Sem permissão para editar compras" };
  }
  const purchaseId = String(formData.get("purchaseId") || "");
  if (!purchaseId) return { ok: false, error: "Compra inválida" };
  const parsed = parsePurchaseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await updateDraftPurchaseForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      purchaseId,
      data: parsed.data,
    });
    revalidatePurchasePaths(purchaseId);
    redirect(`/app/purchases/${purchaseId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao atualizar compra",
    };
  }
}

export async function receivePurchaseAction(
  _prev: PurchaseActionResult | undefined,
  formData: FormData,
): Promise<PurchaseActionResult> {
  const user = await requireSession();
  if (!canReceivePurchases(user.role)) {
    return { ok: false, error: "Sem permissão para receber compras" };
  }
  const purchaseId = String(formData.get("purchaseId") || "");
  if (!purchaseId) return { ok: false, error: "Compra inválida" };
  try {
    await receivePurchaseForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      purchaseId,
    });
    revalidatePurchasePaths(purchaseId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao receber compra",
    };
  }
}

export async function cancelPurchaseAction(
  _prev: PurchaseActionResult | undefined,
  formData: FormData,
): Promise<PurchaseActionResult> {
  const user = await requireSession();
  if (!canCancelPurchases(user.role)) {
    return { ok: false, error: "Sem permissão para cancelar compras" };
  }
  const purchaseId = String(formData.get("purchaseId") || "");
  if (!purchaseId) return { ok: false, error: "Compra inválida" };
  try {
    await cancelPurchaseForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      purchaseId,
    });
    revalidatePurchasePaths(purchaseId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao cancelar compra",
    };
  }
}
