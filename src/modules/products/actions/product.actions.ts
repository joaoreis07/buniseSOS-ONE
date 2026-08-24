"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import { productFormSchema } from "@/modules/products/schemas/product.schemas";
import {
  createProductForTenant,
  deleteProductForTenant,
  updateProductForTenant,
} from "@/modules/products/services/product.service";

export type ProductActionResult = {
  ok: boolean;
  error?: string;
};

function formDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    description: formData.get("description"),
    type: formData.get("type") || "PRODUCT",
    categoryId: formData.get("categoryId"),
    costPrice: formData.get("costPrice"),
    salePrice: formData.get("salePrice"),
    status: formData.get("status") || "ACTIVE",
    imageUrl: formData.get("imageUrl"),
  };
}

export async function createProductAction(
  _prev: ProductActionResult | undefined,
  formData: FormData,
): Promise<ProductActionResult> {
  const user = await requirePermission("products:manage");
  const parsed = productFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const product = await createProductForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/products");
    redirect(`/app/products/${product.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao criar produto",
    };
  }
}

export async function updateProductAction(
  _prev: ProductActionResult | undefined,
  formData: FormData,
): Promise<ProductActionResult> {
  const user = await requirePermission("products:manage");
  const productId = String(formData.get("productId") || "");
  if (!productId) return { ok: false, error: "Produto inválido" };

  const parsed = productFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await updateProductForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      productId,
      data: parsed.data,
    });
    revalidatePath("/app/products");
    revalidatePath(`/app/products/${productId}`);
    redirect(`/app/products/${productId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao atualizar produto",
    };
  }
}

export async function deleteProductAction(
  _prev: ProductActionResult | undefined,
  formData: FormData,
): Promise<ProductActionResult> {
  const user = await requirePermission("products:manage");
  const productId = String(formData.get("productId") || "");
  if (!productId) return { ok: false, error: "Produto inválido" };

  try {
    await deleteProductForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      productId,
    });
    revalidatePath("/app/products");
    redirect("/app/products");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao excluir produto",
    };
  }
}
