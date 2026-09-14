"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import { supplierFormSchema } from "@/modules/purchases/schemas/supplier.schemas";
import {
  createSupplierForTenant,
  updateSupplierForTenant,
} from "@/modules/purchases/services/supplier.service";

export type SupplierActionResult = {
  ok: boolean;
  error?: string;
};

function formDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    tradeName: formData.get("tradeName"),
    document: formData.get("document"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    mobile: formData.get("mobile"),
    zipCode: formData.get("zipCode"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    district: formData.get("district"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country") || "BR",
    status: formData.get("status") || "ACTIVE",
    notes: formData.get("notes"),
  };
}

export async function createSupplierAction(
  _prev: SupplierActionResult | undefined,
  formData: FormData,
): Promise<SupplierActionResult> {
  const user = await requirePermission("suppliers:manage");
  const parsed = supplierFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    const supplier = await createSupplierForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/suppliers");
    redirect(`/app/suppliers/${supplier.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao criar fornecedor",
    };
  }
}

export async function updateSupplierAction(
  _prev: SupplierActionResult | undefined,
  formData: FormData,
): Promise<SupplierActionResult> {
  const user = await requirePermission("suppliers:manage");
  const supplierId = String(formData.get("supplierId") || "");
  if (!supplierId) return { ok: false, error: "Fornecedor inválido" };
  const parsed = supplierFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await updateSupplierForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      supplierId,
      data: parsed.data,
    });
    revalidatePath("/app/suppliers");
    revalidatePath(`/app/suppliers/${supplierId}`);
    redirect(`/app/suppliers/${supplierId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao atualizar fornecedor",
    };
  }
}
