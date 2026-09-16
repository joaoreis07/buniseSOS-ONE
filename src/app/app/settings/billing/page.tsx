import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { SubscriptionPanel } from "@/modules/billing/components/subscription-panel";
import { getSubscriptionOverviewForTenant } from "@/modules/billing/services/billing.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ blocked?: string }>;
}) {
  const user = await requirePermission("billing:view");
  const params = searchParams ? await searchParams : undefined;
  const overview = await getSubscriptionOverviewForTenant({
    companyId: user.companyId,
    role: user.role,
  });

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
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="billing" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minha assinatura</h1>
        <p className="text-muted-foreground">
          Cobrança recorrente do BusinessOS One. Isolada do financeiro interno da
          empresa (vendas e parcelas).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura da empresa</CardTitle>
          <CardDescription>
            O preço vem do plano no servidor. A cobrança é feita pelo Asaas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionPanel
            role={user.role}
            canManage={hasPermission(user.role, "billing:manage")}
            canCancel={hasPermission(user.role, "billing:cancel")}
            subscription={subscription}
            plans={plans}
            blocked={params?.blocked === "1"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
