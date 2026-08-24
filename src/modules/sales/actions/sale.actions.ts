"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireSession } from "@/shared/auth/session";
import { completeSaleSchema } from "@/modules/sales/schemas/sale.schemas";
import {
  canCancelSales,
  canCreateSales,
  cancelSaleForTenant,
  completeSaleForTenant,
} from "@/modules/sales/services/sale.service";

export type SaleActionResult = {
  ok: boolean;
  error?: string;
};

function parseItems(formData: FormData) {
  const raw = String(formData.get("items") || "[]");
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
}

export async function completeSaleAction(
  _prev: SaleActionResult | undefined,
  formData: FormData,
): Promise<SaleActionResult> {
  const user = await requireSession();
  if (!canCreateSales(user.role)) {
    return { ok: false, error: "Sem permissão para registrar vendas" };
  }

  const parsed = completeSaleSchema.safeParse({
    customerId: formData.get("customerId"),
    paymentMethod: formData.get("paymentMethod") || "PIX",
    discountAmount: formData.get("discountAmount") || 0,
    notes: formData.get("notes"),
    items: parseItems(formData),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const sale = await completeSaleForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/sales");
    revalidatePath("/app/inventory");
    redirect(`/app/sales/${sale.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao concluir venda",
    };
  }
}

export async function cancelSaleAction(
  _prev: SaleActionResult | undefined,
  formData: FormData,
): Promise<SaleActionResult> {
  const user = await requireSession();
  if (!canCancelSales(user.role)) {
    return { ok: false, error: "Sem permissão para cancelar vendas" };
  }
  const saleId = String(formData.get("saleId") || "");
  if (!saleId) return { ok: false, error: "Venda inválida" };

  try {
    await cancelSaleForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      saleId,
    });
    revalidatePath("/app/sales");
    revalidatePath(`/app/sales/${saleId}`);
    revalidatePath("/app/inventory");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao cancelar venda",
    };
  }
}
