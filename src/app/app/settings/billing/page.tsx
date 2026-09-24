import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { SubscriptionPanel } from "@/modules/billing/components/subscription-panel";
import { getSubscriptionOverviewForTenant } from "@/modules/billing/services/billing.service";
import { getCompanyUsageSnapshot, isProCompany } from "@/modules/billing/services/entitlements.service";
import { PageContainer } from "@/shared/components/page-layout";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ blocked?: string }>;
}) {
  const user = await requirePermission("billing:view");
  const params = searchParams ? await searchParams : undefined;
  const [overview, usage, isPro] = await Promise.all([
    getSubscriptionOverviewForTenant({
      companyId: user.companyId,
      role: user.role,
    }),
    getCompanyUsageSnapshot(user.companyId),
    isProCompany(user.companyId),
  ]);

  const plans = overview.plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price.toFixed(2),
    interval: plan.interval,
    product: plan.product,
  }));

  const subscription = overview.subscription
    ? {
        id: overview.subscription.id,
        status: overview.subscription.status,
        asaasSubscriptionId: overview.subscription.asaasSubscriptionId,
        startedAt: overview.subscription.startedAt,
        nextDueDate: overview.subscription.nextDueDate,
        lastPaymentAt: overview.subscription.lastPaymentAt,
        lastPaymentStatus: overview.subscription.lastPaymentStatus,
        invoiceUrl: overview.subscription.invoiceUrl,
        cancelledAt: overview.subscription.cancelledAt,
        cancelReason: overview.subscription.cancelReason,
        lastError: overview.subscription.lastError,
        plan: {
          id: overview.subscription.plan.id,
          name: overview.subscription.plan.name,
          description: overview.subscription.plan.description,
          price: overview.subscription.plan.price.toFixed(2),
          interval: overview.subscription.plan.interval,
          product: overview.subscription.plan.product,
        },
      }
    : null;

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="billing" />
      <SubscriptionPanel
        role={user.role}
        canManage={hasPermission(user.role, "billing:manage")}
        canCancel={hasPermission(user.role, "billing:cancel")}
        subscription={subscription}
        plans={plans}
        usage={usage}
        isPro={isPro}
        blocked={params?.blocked === "1"}
      />
    </PageContainer>
  );
}
