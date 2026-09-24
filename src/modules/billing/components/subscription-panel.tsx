"use client";

import { useActionState } from "react";
import type { PlanInterval, Role, SubscriptionStatus } from "@prisma/client";
import { CheckCircle2, Star, Zap } from "lucide-react";
import {
  cancelSubscriptionAction,
  subscribeAction,
  syncSubscriptionAction,
  type BillingActionResult,
} from "@/modules/billing/actions/billing.actions";
import {
  BILLING_PRODUCT_LABELS,
  PLAN_INTERVAL_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/modules/billing/lib/labels";
import type { UsageSnapshot } from "@/modules/billing/lib/entitlements";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { SectionCard, UsageMeter } from "@/shared/components/page-layout";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { cn } from "@/shared/utilities/cn";

type PlanView = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  interval: PlanInterval;
  product: keyof typeof BILLING_PRODUCT_LABELS;
};

type SubscriptionView = {
  id: string;
  status: SubscriptionStatus;
  asaasSubscriptionId: string | null;
  startedAt: Date | string | null;
  nextDueDate: Date | string | null;
  lastPaymentAt: Date | string | null;
  lastPaymentStatus: string | null;
  invoiceUrl: string | null;
  cancelledAt: Date | string | null;
  cancelReason: string | null;
  lastError: string | null;
  plan: PlanView;
};

const PRO_FEATURES = [
  "Usuários ilimitados",
  "Clientes ilimitados",
  "Vendas ilimitadas",
  "Produtos ilimitados",
  "Leads ilimitados",
  "Oportunidades ilimitadas",
  "Comunicações ilimitadas",
  "Compras ilimitadas",
  "Fornecedores ilimitados",
  "Parcelas ilimitadas",
  "Equipe e permissões avançadas",
  "Exportações em massa",
  "Relatórios avançados",
  "Suporte prioritário",
];

function statusBadgeClass(status: SubscriptionStatus) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELLED") return "bg-red-50 text-red-600";
  if (status === "PAST_DUE") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function SubscriptionPanel({
  role,
  canManage,
  canCancel,
  subscription,
  plans,
  usage,
  isPro,
  blocked,
}: {
  role: Role;
  canManage: boolean;
  canCancel: boolean;
  subscription: SubscriptionView | null;
  plans: PlanView[];
  usage: UsageSnapshot[];
  isPro: boolean;
  blocked?: boolean;
}) {
  const [subscribeState, subscribeFormAction, subscribePending] = useActionState<
    BillingActionResult | undefined,
    FormData
  >(subscribeAction, undefined);
  const [cancelState, cancelFormAction, cancelPending] = useActionState<
    BillingActionResult | undefined,
    FormData
  >(cancelSubscriptionAction, undefined);
  const [syncState, syncFormAction, syncPending] = useActionState<
    BillingActionResult | undefined,
    FormData
  >(syncSubscriptionAction, undefined);

  const status = subscription?.status;
  const showSubscribe =
    canManage && (!subscription || status === "CANCELLED" || (status === "PENDING" && !subscription.invoiceUrl));
  const showRetry =
    canManage && status === "PENDING" && Boolean(subscription?.lastError) && !subscription?.invoiceUrl;
  const proPlan = plans.find((plan) => plan.price === "197.00") ?? plans[0];
  const freeUsage = usage.filter((item) => item.limit != null);

  return (
    <div className="max-w-3xl space-y-6">
      {blocked ? (
        <Alert>
          <AlertDescription>
            A assinatura da empresa precisa estar ativa ou em atraso com acesso permitido para usar o
            BusinessOS One.
          </AlertDescription>
        </Alert>
      ) : null}

      <SectionCard className="p-0">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Plano atual</h2>
            <span
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold uppercase",
                isPro ? "bg-[var(--bos-primary)]/10 text-[var(--bos-primary)]" : "bg-slate-100 text-slate-600",
              )}
            >
              {isPro ? "PRO" : "Free"}
            </span>
          </div>
          <p className="mb-5 text-sm text-slate-500">
            {isPro
              ? "Você está no plano PRO com acesso ilimitado a todos os recursos."
              : "Você está no plano gratuito. Faça upgrade para o PRO para ter acesso ilimitado a todos os recursos."}
          </p>

          {!isPro && freeUsage.length > 0 ? (
            <>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Uso atual
              </h3>
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {freeUsage.map((item) => (
                  <UsageMeter
                    key={item.feature}
                    label={item.label}
                    used={item.used}
                    limit={item.limit!}
                    status={item.status}
                  />
                ))}
              </div>
            </>
          ) : null}

          {subscription && isPro ? (
            <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Produto</dt>
                <dd className="font-medium text-slate-800">
                  {BILLING_PRODUCT_LABELS[subscription.plan.product]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Preço</dt>
                <dd className="font-medium text-slate-800">
                  {formatMoneyBRL(subscription.plan.price)} /{" "}
                  {PLAN_INTERVAL_LABELS[subscription.plan.interval].toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Início</dt>
                <dd className="font-medium text-slate-800">{formatDateBR(subscription.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Próxima cobrança</dt>
                <dd className="font-medium text-slate-800">{formatDateBR(subscription.nextDueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Último pagamento</dt>
                <dd className="font-medium text-slate-800">
                  {subscription.lastPaymentAt
                    ? `${formatDateBR(subscription.lastPaymentAt)}${
                        subscription.lastPaymentStatus ? ` · ${subscription.lastPaymentStatus}` : ""
                      }`
                    : subscription.lastPaymentStatus === "PENDING"
                      ? "Aguardando pagamento"
                      : subscription.lastPaymentStatus === "OVERDUE"
                        ? "Em atraso"
                        : subscription.lastPaymentStatus === "FAILED"
                          ? "Falha no pagamento"
                          : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Situação</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                      statusBadgeClass(subscription.status),
                    )}
                  >
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </span>
                </dd>
              </div>
            </dl>
          ) : null}

          {subscription?.lastError ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{subscription.lastError}</AlertDescription>
            </Alert>
          ) : null}

          {subscription?.invoiceUrl ? (
            <div className="mt-4">
              <Button asChild className="rounded-xl">
                <a href={subscription.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  Abrir fatura Asaas
                </a>
              </Button>
            </div>
          ) : null}

          {canManage && subscription?.asaasSubscriptionId ? (
            <form action={syncFormAction} className="mt-4">
              <input type="hidden" name="intent" value="sync" />
              {syncState && !syncState.ok ? (
                <Alert variant="destructive" className="mb-3">
                  <AlertDescription>{syncState.error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" variant="outline" className="rounded-xl" disabled={syncPending}>
                {syncPending ? "Sincronizando..." : "Sincronizar com o provedor"}
              </Button>
            </form>
          ) : null}
        </div>
      </SectionCard>

      {!isPro && (showSubscribe || showRetry) ? (
        <div className="relative overflow-hidden rounded-2xl bg-[var(--bos-navy)] p-6">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-[var(--bos-primary)]/10" />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2">
              <Star size={16} className="text-[var(--bos-primary)]" fill="currentColor" />
              <span className="text-xs font-bold tracking-widest text-[var(--bos-primary)] uppercase">
                Plano PRO
              </span>
            </div>
            <div className="mb-2 flex items-end gap-2">
              <span className="text-4xl font-extrabold text-white">R$ 197</span>
              <span className="mb-1 text-base text-white/50">/mês</span>
            </div>
            <p className="mb-5 text-sm text-white/60">
              Tudo liberado. Sem limites. Cresça sem barreira.
            </p>

            <div className="mb-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {PRO_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-white/75">
                  <CheckCircle2 size={13} className="shrink-0 text-[var(--bos-primary)]" />
                  {feature}
                </div>
              ))}
            </div>

            {subscribeState && !subscribeState.ok ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{subscribeState.error}</AlertDescription>
              </Alert>
            ) : null}

            {plans.length === 0 ? (
              <p className="text-sm text-white/60">Nenhum plano ativo.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {plans.map((plan) => (
                  <form key={plan.id} action={subscribeFormAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <Button
                      type="submit"
                      disabled={subscribePending || !canManage}
                      className="gap-2 rounded-xl bg-[var(--bos-primary)] font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-[var(--bos-primary-hover)]"
                    >
                      <Zap size={14} />
                      {subscribePending
                        ? "Iniciando..."
                        : status === "CANCELLED"
                          ? "Contratar novamente"
                          : "Fazer upgrade para PRO"}
                    </Button>
                  </form>
                ))}
              </div>
            )}

            {proPlan?.description ? (
              <p className="mt-3 text-xs text-white/30">{proPlan.description}</p>
            ) : (
              <p className="mt-3 text-xs text-white/30">
                Cobrança via boleto, PIX ou cartão · Cancele quando quiser
              </p>
            )}
          </div>
        </div>
      ) : null}

      {canCancel && subscription && status !== "CANCELLED" ? (
        <SectionCard title="Cancelar assinatura">
          <form action={cancelFormAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-semibold text-slate-600">
                Motivo (opcional)
              </Label>
              <Input id="reason" name="reason" maxLength={500} className="rounded-lg" />
            </div>
            {cancelState && !cancelState.ok ? (
              <Alert variant="destructive">
                <AlertDescription>{cancelState.error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" variant="destructive" className="rounded-xl" disabled={cancelPending}>
              {cancelPending ? "Cancelando..." : "Cancelar assinatura"}
            </Button>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title="Sobre a assinatura PRO">
        <div className="space-y-2 text-sm text-slate-500">
          <p>
            • A cobrança é realizada mensalmente via{" "}
            <strong className="text-slate-700">Asaas</strong> (boleto, PIX ou cartão).
          </p>
          <p>
            • Você pode cancelar a qualquer momento. O acesso continua até o fim do período pago.
          </p>
          <p>
            • Em caso de downgrade para Free, seus dados existentes continuam visíveis, mas não
            poderá criar novos registros além dos limites.
          </p>
          <p>• Seus dados nunca serão apagados em nenhuma hipótese de cancelamento.</p>
        </div>
      </SectionCard>

      {!canManage && role !== "ADMIN" ? (
        <p className="text-xs text-slate-400">
          Somente administradores e gestores podem alterar a cobrança da empresa.
        </p>
      ) : null}
    </div>
  );
}
