import { cache } from "react";
import { prisma } from "@/shared/db/prisma";
import {
  buildUsage,
  FEATURE_LABELS,
  FREE_LIMITS,
  type PlanFeature,
  type UsageSnapshot,
} from "@/modules/billing/lib/entitlements";
import { isFreePlanSlug, isProPlanSlug } from "@/modules/billing/lib/plans";
import { findSubscriptionByCompanyProduct } from "@/modules/billing/repositories/billing.repository";

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public feature: PlanFeature,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function getCompanyPlanSlug(companyId: string): Promise<string | null> {
  const subscription = await findSubscriptionByCompanyProduct(companyId, "ONE");
  return subscription?.plan.slug ?? null;
}

export async function isProCompany(companyId: string): Promise<boolean> {
  const slug = await getCompanyPlanSlug(companyId);
  return slug ? isProPlanSlug(slug) : false;
}

export async function isFreeCompany(companyId: string): Promise<boolean> {
  const slug = await getCompanyPlanSlug(companyId);
  return slug ? isFreePlanSlug(slug) : true;
}

function monthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export async function countFeatureUsage(
  companyId: string,
  feature: PlanFeature,
): Promise<number> {
  const { start, end } = monthRange();
  switch (feature) {
    case "users":
      return prisma.membership.count({
        where: { companyId, deletedAt: null },
      });
    case "customers":
      return prisma.customer.count({ where: { companyId, deletedAt: null } });
    case "products":
      return prisma.product.count({ where: { companyId, deletedAt: null } });
    case "leads":
      return prisma.lead.count({ where: { companyId, deletedAt: null } });
    case "opportunities":
      return prisma.opportunity.count({ where: { companyId, deletedAt: null } });
    case "sales_month":
      return prisma.sale.count({
        where: {
          companyId,
          createdAt: { gte: start, lt: end },
          status: { not: "CANCELLED" },
        },
      });
    case "communications_month":
      return prisma.communication.count({
        where: { companyId, createdAt: { gte: start, lt: end } },
      });
    case "suppliers":
      return prisma.supplier.count({ where: { companyId } });
    case "purchases_month":
      return prisma.purchase.count({
        where: {
          companyId,
          createdAt: { gte: start, lt: end },
          status: { not: "CANCELLED" },
        },
      });
    case "open_installments":
      return prisma.installment.count({
        where: {
          companyId,
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
      });
    default:
      return 0;
  }
}

export async function getFeatureLimit(
  companyId: string,
  feature: PlanFeature,
): Promise<number | null> {
  if (await isProCompany(companyId)) return null;
  return FREE_LIMITS[feature];
}

export async function checkPlanLimit(params: {
  companyId: string;
  feature: PlanFeature;
  increment?: number;
}): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const limit = await getFeatureLimit(params.companyId, params.feature);
  const used = await countFeatureUsage(params.companyId, params.feature);
  const increment = params.increment ?? 1;
  if (limit == null) return { allowed: true, used, limit: null };
  return { allowed: used + increment <= limit, used, limit };
}

export async function assertPlanLimit(params: {
  companyId: string;
  feature: PlanFeature;
  increment?: number;
}) {
  const result = await checkPlanLimit(params);
  if (!result.allowed) {
    throw new PlanLimitError(
      `Limite do plano Free atingido para ${FEATURE_LABELS[params.feature]}. Faça upgrade para PRO.`,
      params.feature,
    );
  }
}

export const getCompanyUsageSnapshot = cache(
  async (companyId: string): Promise<UsageSnapshot[]> => {
    const isPro = await isProCompany(companyId);
    const features = Object.keys(FREE_LIMITS) as PlanFeature[];
    const counts = await Promise.all(
      features.map(async (feature) => {
        const used = await countFeatureUsage(companyId, feature);
        const limit = isPro ? null : FREE_LIMITS[feature];
        return buildUsage(feature, FEATURE_LABELS[feature], used, limit);
      }),
    );
    return counts;
  },
);
