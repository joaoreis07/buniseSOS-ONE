"use server";

import { publicErrorMessage } from "@/shared/errors/public-error";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission, requireSession } from "@/shared/auth/session";
import {
  minimumQuantitySchema,
  movementFormSchema,
} from "@/modules/inventory/schemas/inventory.schemas";
import {
  canRegisterMovements,
  initializeInventoryForTenant,
  registerMovementForTenant,
  updateMinimumQuantityForTenant,
} from "@/modules/inventory/services/inventory.service";

export type InventoryActionResult = {
  ok: boolean;
  error?: string;
};

function revalidateInventoryPaths(productId: string) {
  revalidatePath("/app/inventory");
  revalidatePath(`/app/inventory/${productId}`);
  revalidatePath(`/app/inventory/${productId}/movements`);
}

export async function initializeInventoryAction(
  formData: FormData,
): Promise<InventoryActionResult> {
  const user = await requirePermission("inventory:manage");
  const productId = String(formData.get("productId") || "");
  if (!productId) return { ok: false, error: "Produto inválido" };

  try {
    await initializeInventoryForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      productId,
    });
    revalidateInventoryPaths(productId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        publicErrorMessage(error, "Falha ao inicializar estoque"),
    };
  }
}

export async function updateMinimumQuantityAction(
  _prev: InventoryActionResult | undefined,
  formData: FormData,
): Promise<InventoryActionResult> {
  const user = await requirePermission("inventory:manage");
  const productId = String(formData.get("productId") || "");
  if (!productId) return { ok: false, error: "Produto inválido" };

  const parsed = minimumQuantitySchema.safeParse({
    minimumQuantity: formData.get("minimumQuantity"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await updateMinimumQuantityForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      productId,
      data: parsed.data,
    });
    revalidateInventoryPaths(productId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao atualizar estoque mínimo",
    };
  }
}

export async function registerMovementAction(
  _prev: InventoryActionResult | undefined,
  formData: FormData,
): Promise<InventoryActionResult> {
  const user = await requireSession();
  if (!canRegisterMovements(user.role)) {
    return { ok: false, error: "Sem permissão para movimentações" };
  }
  const productId = String(formData.get("productId") || "");
  if (!productId) return { ok: false, error: "Produto inválido" };

  const parsed = movementFormSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    targetQuantity: formData.get("targetQuantity"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await registerMovementForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      productId,
      data: parsed.data,
    });
    revalidateInventoryPaths(productId);
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao registrar movimentação",
    };
  }
}
