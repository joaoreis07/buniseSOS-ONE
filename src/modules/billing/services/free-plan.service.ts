import { prisma } from "@/shared/db/prisma";
import { PLAN_SLUG_FREE } from "@/modules/billing/lib/plans";
import { upsertSubscription } from "@/modules/billing/repositories/billing.repository";

export async function ensureFreeSubscription(companyId: string) {
  const plan = await prisma.plan.findUnique({
    where: { slug: PLAN_SLUG_FREE },
  });
  if (!plan) {
    throw new Error("Plano Free não configurado");
  }

  const existing = await prisma.subscription.findUnique({
    where: { companyId_product: { companyId, product: "ONE" } },
  });
  if (existing) return existing;

  return upsertSubscription({
    companyId,
    product: "ONE",
    planId: plan.id,
    data: {
      companyId,
      planId: plan.id,
      product: "ONE",
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });
}
