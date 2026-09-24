import { cache } from "react";
import { prisma } from "@/shared/db/prisma";

export const getCompanyShellData = cache(async (companyId: string) => {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: {
      name: true,
      settings: { select: { displayName: true, onboardingCompletedAt: true } },
    },
  });
});

export function companyDisplayName(
  company: Awaited<ReturnType<typeof getCompanyShellData>>,
): string {
  return company?.settings?.displayName?.trim() || company?.name || "Empresa";
}
