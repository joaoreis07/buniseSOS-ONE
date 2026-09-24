"use server";

import { publicErrorMessage } from "@/shared/errors/public-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePermission } from "@/shared/auth/session";
import { customerFormSchema } from "@/modules/crm/schemas/customer.schemas";
import {
  createCustomerForTenant,
  deleteCustomerForTenant,
  getCustomerProfileForTenant,
  updateCustomerForTenant,
} from "@/modules/crm/services/customer.service";

export type CustomerActionResult = {
  ok: boolean;
  error?: string;
  customerId?: string;
};

function formDataToObject(formData: FormData) {
  return {
    type: formData.get("type") || "INDIVIDUAL",
    name: formData.get("name"),
    tradeName: formData.get("tradeName"),
    document: formData.get("document"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    mobile: formData.get("mobile"),
    whatsapp: formData.get("whatsapp"),
    zipCode: formData.get("zipCode"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    district: formData.get("district"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country") || "BR",
    status: formData.get("status") || "ACTIVE",
    origin: formData.get("origin"),
    notes: formData.get("notes"),
    ownerId: formData.get("ownerId"),
  };
}

export async function createCustomerAction(
  _prev: CustomerActionResult | undefined,
  formData: FormData,
): Promise<CustomerActionResult> {
  const user = await requirePermission("crm:manage");
  const parsed = customerFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const customer = await createCustomerForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/crm");
    redirect(`/app/crm/${customer.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao criar cliente"),
    };
  }
}

export async function updateCustomerAction(
  _prev: CustomerActionResult | undefined,
  formData: FormData,
): Promise<CustomerActionResult> {
  const user = await requirePermission("crm:manage");
  const customerId = String(formData.get("customerId") || "");
  if (!customerId) {
    return { ok: false, error: "Cliente inválido" };
  }

  const parsed = customerFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await updateCustomerForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      customerId,
      data: parsed.data,
    });
    revalidatePath("/app/crm");
    revalidatePath(`/app/crm/${customerId}`);
    redirect(`/app/crm/${customerId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao atualizar cliente"),
    };
  }
}

export async function deleteCustomerAction(
  _prev: CustomerActionResult | undefined,
  formData: FormData,
): Promise<CustomerActionResult> {
  const user = await requirePermission("crm:manage");
  const customerId = String(formData.get("customerId") || "");
  if (!customerId) {
    return { ok: false, error: "Cliente inválido" };
  }

  try {
    await deleteCustomerForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      customerId,
    });
    revalidatePath("/app/crm");
    redirect("/app/crm");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao excluir cliente"),
    };
  }
}

export async function loadCustomerDrawerAction(customerId: string) {
  try {
    const user = await requirePermission("crm:view");
    const profile = await getCustomerProfileForTenant({
      companyId: user.companyId,
      role: user.role,
      customerId,
    });
    if (!profile) {
      return { ok: false as const, error: "Cliente não encontrado", data: null };
    }
    return { ok: true as const, data: profile, error: undefined };
  } catch (error) {
    return {
      ok: false as const,
      error: publicErrorMessage(error, "Falha ao carregar cliente"),
      data: null,
    };
  }
}
