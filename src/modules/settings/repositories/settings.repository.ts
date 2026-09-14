import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

export const companyProfileSelect = {
  id: true,
  name: true,
  tradeName: true,
  document: true,
  email: true,
  phone: true,
  whatsapp: true,
  website: true,
  description: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  district: true,
  city: true,
  state: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function findCompanyProfile(companyId: string) {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: companyProfileSelect,
  });
}

export async function updateCompanyProfile(params: {
  companyId: string;
  data: Prisma.CompanyUpdateInput;
}) {
  return prisma.company.update({
    where: { id: params.companyId },
    data: params.data,
    select: companyProfileSelect,
  });
}

export async function findCompanySettings(companyId: string) {
  return prisma.companySettings.upsert({
    where: { companyId },
    update: {},
    create: { companyId },
  });
}

export async function updateCompanySettings(params: {
  companyId: string;
  data: Prisma.CompanySettingsUpdateInput;
}) {
  await findCompanySettings(params.companyId);
  return prisma.companySettings.update({
    where: { companyId: params.companyId },
    data: params.data,
  });
}
