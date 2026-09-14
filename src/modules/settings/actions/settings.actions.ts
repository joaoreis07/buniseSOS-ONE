"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/shared/auth/session";
import { LOGO_MAX_BYTES } from "@/shared/storage/tenant-files";
import {
  brandingSchema,
  companyProfileSchema,
  documentSettingsSchema,
  preferencesSchema,
} from "@/modules/settings/schemas/settings.schemas";
import {
  canManageSettings,
  removeCompanyLogoForTenant,
  updateBrandingForTenant,
  updateCompanyProfileForTenant,
  updateDocumentSettingsForTenant,
  updatePreferencesForTenant,
  uploadCompanyLogoForTenant,
} from "@/modules/settings/services/settings.service";

export type SettingsActionResult = {
  ok: boolean;
  error?: string;
};

function fail(error: unknown, fallback: string): SettingsActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : fallback,
  };
}

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function updateCompanyProfileAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await requireSession();
  if (!canManageSettings(user.role)) {
    return { ok: false, error: "Sem permissão para alterar a empresa" };
  }
  const parsed = companyProfileSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await updateCompanyProfileForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (error) {
    return fail(error, "Falha ao atualizar a empresa");
  }
}

export async function updatePreferencesAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await requireSession();
  if (!canManageSettings(user.role)) {
    return { ok: false, error: "Sem permissão para alterar preferências" };
  }
  const parsed = preferencesSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await updatePreferencesForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/settings/preferences");
    return { ok: true };
  } catch (error) {
    return fail(error, "Falha ao atualizar preferências");
  }
}

export async function updateBrandingAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await requireSession();
  if (!canManageSettings(user.role)) {
    return { ok: false, error: "Sem permissão para alterar a identidade visual" };
  }
  const parsed = brandingSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await updateBrandingForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/settings/branding");
    return { ok: true };
  } catch (error) {
    return fail(error, "Falha ao atualizar a identidade visual");
  }
}

export async function updateDocumentSettingsAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await requireSession();
  if (!canManageSettings(user.role)) {
    return { ok: false, error: "Sem permissão para alterar documentos" };
  }
  const parsed = documentSettingsSchema.safeParse({
    ...formObject(formData),
    allowSaleWithoutCustomer: formData.get("allowSaleWithoutCustomer"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  try {
    await updateDocumentSettingsForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      data: parsed.data,
    });
    revalidatePath("/app/settings/documents");
    revalidatePath("/app/sales/new");
    revalidatePath("/app/purchases/new");
    return { ok: true };
  } catch (error) {
    return fail(error, "Falha ao atualizar documentos");
  }
}

export async function uploadCompanyLogoAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await requireSession();
  if (!canManageSettings(user.role)) {
    return { ok: false, error: "Sem permissão para alterar a logo" };
  }
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem JPEG ou PNG" };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, error: "Logo deve ter no máximo 2 MB" };
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadCompanyLogoForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      buffer,
    });
    revalidatePath("/app/settings/branding");
    return { ok: true };
  } catch (error) {
    return fail(error, "Falha ao enviar a logo");
  }
}

export async function removeCompanyLogoAction(
  _prev: SettingsActionResult | undefined,
  _formData: FormData,
): Promise<SettingsActionResult> {
  void _prev;
  void _formData;
  const user = await requireSession();
  if (!canManageSettings(user.role)) {
    return { ok: false, error: "Sem permissão para alterar a logo" };
  }
  try {
    await removeCompanyLogoForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
    });
    revalidatePath("/app/settings/branding");
    return { ok: true };
  } catch (error) {
    return fail(error, "Falha ao remover a logo");
  }
}
