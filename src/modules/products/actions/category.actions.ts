"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import { categoryFormSchema } from "@/modules/products/schemas/category.schemas";
import {
  createCategoryForTenant,
  deleteCategoryForTenant,
  updateCategoryForTenant,
} from "@/modules/products/services/category.service";

export type CategoryActionResult = {
  ok: boolean;
  error?: string;
};

function formDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
  };
}

export async function createCategoryAction(
  _prev: CategoryActionResult | undefined,
  formData: FormData,
): Promise<CategoryActionResult> {
  const user = await requirePermission("categories:manage");
  const parsed = categoryFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await createCategoryForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/products/categories");
    revalidatePath("/app/products");
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao criar categoria",
    };
  }
}

export async function updateCategoryAction(
  _prev: CategoryActionResult | undefined,
  formData: FormData,
): Promise<CategoryActionResult> {
  const user = await requirePermission("categories:manage");
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) return { ok: false, error: "Categoria inválida" };

  const parsed = categoryFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await updateCategoryForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      categoryId,
      data: parsed.data,
    });
    revalidatePath("/app/products/categories");
    revalidatePath("/app/products");
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao atualizar categoria",
    };
  }
}

export async function deleteCategoryAction(
  _prev: CategoryActionResult | undefined,
  formData: FormData,
): Promise<CategoryActionResult> {
  const user = await requirePermission("categories:manage");
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) return { ok: false, error: "Categoria inválida" };

  try {
    await deleteCategoryForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      categoryId,
    });
    revalidatePath("/app/products/categories");
    revalidatePath("/app/products");
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao excluir categoria",
    };
  }
}
