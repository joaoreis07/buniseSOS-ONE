import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import {
  deleteCompanyFile,
  readCompanyLogo,
  saveCompanyLogo,
} from "@/shared/storage/tenant-files";
import type {
  BrandingInput,
  CompanyProfileInput,
  DocumentSettingsInput,
  PreferencesInput,
} from "@/modules/settings/schemas/settings.schemas";
import {
  findCompanyProfile,
  findCompanySettings,
  updateCompanyProfile,
  updateCompanySettings,
} from "@/modules/settings/repositories/settings.repository";

export function canViewSettings(role: Role) {
  return hasPermission(role, "settings:view");
}

export function canManageSettings(role: Role) {
  return hasPermission(role, "settings:manage");
}

function assertManage(role: Role) {
  assertPermission(role, "settings:manage");
}

export async function getCompanyProfileForTenant(params: {
  companyId: string;
  role: Role;
}) {
  assertPermission(params.role, "settings:view");
  const [company, settings] = await Promise.all([
    findCompanyProfile(params.companyId),
    findCompanySettings(params.companyId),
  ]);
  return { company, settings };
}

export async function updateCompanyProfileForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: CompanyProfileInput;
}) {
  assertManage(params.role);
  const existing = await findCompanyProfile(params.companyId);
  if (!existing) throw new Error("Empresa não encontrada");

  const updated = await updateCompanyProfile({
    companyId: params.companyId,
    data: {
      name: params.data.name,
      tradeName: params.data.tradeName,
      document: params.data.document,
      email: params.data.email,
      phone: params.data.phone,
      whatsapp: params.data.whatsapp,
      website: params.data.website,
      description: params.data.description,
      zipCode: params.data.zipCode,
      street: params.data.street,
      number: params.data.number,
      complement: params.data.complement,
      district: params.data.district,
      city: params.data.city,
      state: params.data.state ? params.data.state.toUpperCase() : null,
    },
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "settings",
    action: "COMPANY_SETTINGS_UPDATED",
    entity: "Company",
    entityId: params.companyId,
    metadata: { fields: Object.keys(params.data) },
  });

  return updated;
}

export async function updatePreferencesForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: PreferencesInput;
}) {
  assertManage(params.role);
  const updated = await updateCompanySettings({
    companyId: params.companyId,
    data: {
      language: params.data.language,
      currency: params.data.currency,
      timezone: params.data.timezone,
      dateFormat: params.data.dateFormat,
      theme: params.data.theme,
    },
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "settings",
    action: "COMPANY_SETTINGS_UPDATED",
    entity: "CompanySettings",
    entityId: updated.id,
    metadata: { section: "preferences" },
  });
  return updated;
}

export async function updateBrandingForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: BrandingInput;
}) {
  assertManage(params.role);
  const updated = await updateCompanySettings({
    companyId: params.companyId,
    data: {
      displayName: params.data.displayName,
      primaryColor: params.data.primaryColor.toLowerCase(),
      secondaryColor: params.data.secondaryColor.toLowerCase(),
    },
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "settings",
    action: "BRANDING_UPDATED",
    entity: "CompanySettings",
    entityId: updated.id,
    metadata: {
      displayName: params.data.displayName,
      primaryColor: params.data.primaryColor,
    },
  });
  return updated;
}

export async function updateDocumentSettingsForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: DocumentSettingsInput;
}) {
  assertManage(params.role);
  const updated = await updateCompanySettings({
    companyId: params.companyId,
    data: {
      documentTitle: params.data.documentTitle,
      documentHeader: params.data.documentHeader,
      documentFooter: params.data.documentFooter,
      communicationSignature: params.data.communicationSignature,
      defaultSaleNotes: params.data.defaultSaleNotes,
      defaultPurchaseNotes: params.data.defaultPurchaseNotes,
      defaultReceiptNotes: params.data.defaultReceiptNotes,
      allowSaleWithoutCustomer: params.data.allowSaleWithoutCustomer,
      defaultInstallmentCount: params.data.defaultInstallmentCount,
    },
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "settings",
    action: "DOCUMENT_SETTINGS_UPDATED",
    entity: "CompanySettings",
    entityId: updated.id,
    metadata: {
      allowSaleWithoutCustomer: params.data.allowSaleWithoutCustomer,
      defaultInstallmentCount: params.data.defaultInstallmentCount,
    },
  });
  return updated;
}

export async function uploadCompanyLogoForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  buffer: Buffer;
}) {
  assertManage(params.role);
  const current = await findCompanySettings(params.companyId);
  const saved = await saveCompanyLogo({
    companyId: params.companyId,
    buffer: params.buffer,
  });
  try {
    const updated = await updateCompanySettings({
      companyId: params.companyId,
      data: { logoPath: saved.relativePath },
    });
    await deleteCompanyFile({
      companyId: params.companyId,
      relativePath: current.logoPath,
    });
    await writeAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      module: "settings",
      action: "LOGO_UPDATED",
      entity: "CompanySettings",
      entityId: updated.id,
      metadata: { checksum: saved.checksum, kind: saved.kind },
    });
    return updated;
  } catch (error) {
    await deleteCompanyFile({
      companyId: params.companyId,
      relativePath: saved.relativePath,
    });
    throw error;
  }
}

export async function removeCompanyLogoForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
}) {
  assertManage(params.role);
  const current = await findCompanySettings(params.companyId);
  const updated = await updateCompanySettings({
    companyId: params.companyId,
    data: { logoPath: null },
  });
  await deleteCompanyFile({
    companyId: params.companyId,
    relativePath: current.logoPath,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "settings",
    action: "LOGO_UPDATED",
    entity: "CompanySettings",
    entityId: updated.id,
    metadata: { removed: true },
  });
  return updated;
}

export async function readCompanyLogoForTenant(params: {
  companyId: string;
  role: Role;
}) {
  assertPermission(params.role, "settings:view");
  const settings = await findCompanySettings(params.companyId);
  if (!settings.logoPath) return null;
  return readCompanyLogo({
    companyId: params.companyId,
    relativePath: settings.logoPath,
  });
}

export async function readCompanyLogoForSession(companyId: string) {
  const settings = await findCompanySettings(companyId);
  if (!settings.logoPath) return null;
  try {
    return await readCompanyLogo({
      companyId,
      relativePath: settings.logoPath,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}

export async function getOperationalDefaults(companyId: string) {
  const settings = await findCompanySettings(companyId);
  return {
    defaultSaleNotes: settings.defaultSaleNotes,
    defaultPurchaseNotes: settings.defaultPurchaseNotes,
    allowSaleWithoutCustomer: settings.allowSaleWithoutCustomer,
    defaultInstallmentCount: settings.defaultInstallmentCount,
  };
}
