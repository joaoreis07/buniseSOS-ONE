/**
 * Settings / branding / logo verification (FASE 14) — BusinessOS One only.
 * Run: npm run verify:settings
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { detectImageKind, validateLogoUpload } from "../src/shared/storage/tenant-files";
import {
  getCompanyProfileForTenant,
  removeCompanyLogoForTenant,
  updateBrandingForTenant,
  updateCompanyProfileForTenant,
  updateDocumentSettingsForTenant,
  updatePreferencesForTenant,
  uploadCompanyLogoForTenant,
} from "../src/modules/settings/services/settings.service";
import { completeSaleForTenant } from "../src/modules/sales/services/sale.service";

const prisma = new PrismaClient();

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function expectThrow(fn: () => Promise<unknown>, message: string) {
  let thrown = false;
  try {
    await fn();
  } catch {
    thrown = true;
  }
  assert(thrown, message);
}

async function registerTenant(input: {
  name: string;
  email: string;
  companyName: string;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email.toLowerCase(), passwordHash },
    });
    const company = await tx.company.create({ data: { name: input.companyName } });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    await tx.companySettings.create({ data: { companyId: company.id } });
    return { user, company };
  });
}

async function addMember(params: {
  companyId: string;
  name: string;
  email: string;
  role: Role;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  const user = await prisma.user.create({
    data: { name: params.name, email: params.email.toLowerCase(), passwordHash },
  });
  await prisma.membership.create({
    data: { userId: user.id, companyId: params.companyId, role: params.role },
  });
  return user;
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  assert(hasPermission("ADMIN", "settings:manage"), "ADMIN settings:manage");
  assert(hasPermission("MANAGER", "settings:manage"), "MANAGER settings:manage");
  assert(hasPermission("MANAGER", "settings:view"), "MANAGER settings:view");
  assert(!hasPermission("SALES", "settings:manage"), "SALES no settings:manage");
  assert(!hasPermission("SALES", "settings:view"), "SALES no settings:view");
  assert(!hasPermission("FINANCE", "settings:manage"), "FINANCE no settings:manage");
  assert(hasPermission("SALES", "sales:view"), "SALES can view sales/receipts");
  assert(!hasPermission("SALES", "purchases:view"), "SALES no purchase documents");

  assert(detectImageKind(PNG_1X1) === "png", "png magic");
  assert(detectImageKind(Buffer.from([0x4d, 0x5a, 0x90])) === null, "exe rejected by magic");
  let exeBlocked = false;
  try {
    validateLogoUpload(Buffer.from([0x4d, 0x5a, 0x90, 0x00]));
  } catch {
    exeBlocked = true;
  }
  assert(exeBlocked, "executable logo blocked");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin Settings A",
    email: `set-a-${suffix}@example.com`,
    companyName: `Empresa Settings A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin Settings B",
    email: `set-b-${suffix}@example.com`,
    companyName: `Empresa Settings B ${suffix}`,
  });
  const salesUser = await addMember({
    companyId: a.company.id,
    name: "Vendedor Settings",
    email: `set-sales-${suffix}@example.com`,
    role: "SALES",
  });

  await updateCompanyProfileForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      name: `Empresa Settings A ${suffix}`,
      tradeName: "Fantasia A",
      document: "00.000.000/0001-00",
      email: `empresa-a-${suffix}@example.com`,
      phone: "1133334444",
      whatsapp: "11988887777",
      website: "https://empresa-a.example",
      description: "Tenant A",
      zipCode: "01310-100",
      street: "Av Paulista",
      number: "1000",
      complement: null,
      district: "Bela Vista",
      city: "São Paulo",
      state: "sp",
    },
  });

  const profileA = await getCompanyProfileForTenant({
    companyId: a.company.id,
    role: "ADMIN",
  });
  assert(profileA.company?.tradeName === "Fantasia A", "profile updated");
  assert(profileA.company?.state === "SP", "state uppercased");
  assert(profileA.company?.whatsapp === "11988887777", "whatsapp saved");

  const profileB = await getCompanyProfileForTenant({
    companyId: b.company.id,
    role: "ADMIN",
  });
  assert(profileB.company?.tradeName == null, "tenant B does not see A profile");
  assert(profileB.company?.name.includes("Settings B"), "tenant B own name");

  await expectThrow(
    () =>
      updateCompanyProfileForTenant({
        companyId: a.company.id,
        userId: salesUser.id,
        role: "SALES",
        data: {
          name: "Hack",
          tradeName: null,
          document: null,
          email: null,
          phone: null,
          whatsapp: null,
          website: null,
          description: null,
          zipCode: null,
          street: null,
          number: null,
          complement: null,
          district: null,
          city: null,
          state: null,
        },
      }),
    "SALES cannot update company",
  );

  await updatePreferencesForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      language: "pt-BR",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      dateFormat: "dd/MM/yyyy",
      theme: "light",
    },
  });

  await updateBrandingForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      displayName: "Marca A",
      primaryColor: "#115e59",
      secondaryColor: "#111827",
    },
  });

  await uploadCompanyLogoForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    buffer: PNG_1X1,
  });
  const withLogo = await getCompanyProfileForTenant({
    companyId: a.company.id,
    role: "ADMIN",
  });
  assert(withLogo.settings.logoPath?.startsWith(`${a.company.id}/`), "logo path tenant prefixed");

  await expectThrow(
    () =>
      uploadCompanyLogoForTenant({
        companyId: a.company.id,
        userId: salesUser.id,
        role: "SALES",
        buffer: PNG_1X1,
      }),
    "SALES cannot upload logo",
  );

  await expectThrow(
    () =>
      uploadCompanyLogoForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]),
      }),
    "exe upload blocked",
  );

  await uploadCompanyLogoForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    buffer: PNG_1X1,
  });
  const replaced = await getCompanyProfileForTenant({
    companyId: a.company.id,
    role: "ADMIN",
  });
  assert(replaced.settings.logoPath !== withLogo.settings.logoPath, "logo replaced");

  const logoB = await getCompanyProfileForTenant({
    companyId: b.company.id,
    role: "ADMIN",
  });
  assert(!logoB.settings.logoPath, "tenant B has no logo");

  await updateDocumentSettingsForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      documentTitle: "Recibo da casa",
      documentHeader: "Cabeçalho A",
      documentFooter: "Rodapé A",
      communicationSignature: "Atenciosamente,\nMarca A",
      defaultSaleNotes: "Obs venda A",
      defaultPurchaseNotes: "Obs compra A",
      defaultReceiptNotes: "Texto recibo A",
      allowSaleWithoutCustomer: false,
      defaultInstallmentCount: 3,
    },
  });

  const product = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Settings ${suffix}`,
      sku: `SET-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 10,
    },
  });
  await expectThrow(
    () =>
      completeSaleForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        data: {
          customerId: null,
          paymentMethod: "PIX",
          discountAmount: 0,
          notes: null,
          items: [{ productId: product.id, quantity: 1, discountAmount: 0 }],
        },
      }),
    "sale without customer blocked by settings",
  );

  await updateDocumentSettingsForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      documentTitle: "Recibo da casa",
      documentHeader: "Cabeçalho A",
      documentFooter: "Rodapé A",
      communicationSignature: "Atenciosamente,\nMarca A",
      defaultSaleNotes: "Obs venda A",
      defaultPurchaseNotes: "Obs compra A",
      defaultReceiptNotes: "Texto recibo A",
      allowSaleWithoutCustomer: true,
      defaultInstallmentCount: 3,
    },
  });

  const audits = await prisma.auditLog.findMany({
    where: {
      companyId: a.company.id,
      action: {
        in: [
          "COMPANY_SETTINGS_UPDATED",
          "BRANDING_UPDATED",
          "DOCUMENT_SETTINGS_UPDATED",
          "LOGO_UPDATED",
        ],
      },
    },
  });
  const actions = new Set(audits.map((item) => item.action));
  assert(actions.has("COMPANY_SETTINGS_UPDATED"), "audit company");
  assert(actions.has("BRANDING_UPDATED"), "audit branding");
  assert(actions.has("DOCUMENT_SETTINGS_UPDATED"), "audit documents");
  assert(actions.has("LOGO_UPDATED"), "audit logo");

  const foreignAudits = await prisma.auditLog.count({
    where: { companyId: b.company.id, action: "BRANDING_UPDATED" },
  });
  assert(foreignAudits === 0, "no branding audit leaked to B");

  await removeCompanyLogoForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
  });
  const afterRemove = await getCompanyProfileForTenant({
    companyId: a.company.id,
    role: "ADMIN",
  });
  assert(!afterRemove.settings.logoPath, "logo removed");

  console.log("SETTINGS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
