"use client";

import { useActionState } from "react";
import type { PlanInterval, Role, SubscriptionStatus } from "@prisma/client";
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
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";

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

function statusVariant(status: SubscriptionStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function SubscriptionPanel({
  role,
  canManage,
  canCancel,
  subscription,
  plans,
  blocked,
}: {
  role: Role;
  canManage: boolean;
  canCancel: boolean;
  subscription: SubscriptionView | null;
  plans: PlanView[];
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

  return (
    <div className="space-y-6">
      {blocked ? (
        <Alert>
          <AlertDescription>
            A assinatura da empresa precisa estar ativa ou em atraso com acesso
            permitido para usar o BusinessOS One.
          </AlertDescription>
        </Alert>
      ) : null}

      {subscription ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">{subscription.plan.name}</h2>
            <Badge variant={statusVariant(subscription.status)}>
              {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
            </Badge>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Produto</dt>
              <dd>{BILLING_PRODUCT_LABELS[subscription.plan.product]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Preço</dt>
              <dd>
                {formatMoneyBRL(subscription.plan.price)} /{" "}
                {PLAN_INTERVAL_LABELS[subscription.plan.interval].toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Início</dt>
              <dd>{formatDateBR(subscription.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Próxima cobrança</dt>
              <dd>{formatDateBR(subscription.nextDueDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Último pagamento</dt>
              <dd>
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
              <dt className="text-muted-foreground">Situação</dt>
              <dd>{SUBSCRIPTION_STATUS_LABELS[subscription.status]}</dd>
            </div>
          </dl>

          {subscription.lastError ? (
            <Alert variant="destructive">
              <AlertDescription>{subscription.lastError}</AlertDescription>
            </Alert>
          ) : null}

          {subscription.invoiceUrl ? (
            <Button asChild>
              <a
                href={subscription.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir fatura Asaas
              </a>
            </Button>
          ) : null}

          {canManage && subscription.asaasSubscriptionId ? (
            <form action={syncFormAction}>
              <input type="hidden" name="intent" value="sync" />
              {syncState && !syncState.ok ? (
                <Alert variant="destructive" className="mb-3">
                  <AlertDescription>{syncState.error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" variant="outline" disabled={syncPending}>
                {syncPending ? "Sincronizando..." : "Sincronizar com o provedor"}
              </Button>
            </form>
          ) : null}

          {canCancel && status !== "CANCELLED" ? (
            <form action={cancelFormAction} className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">Cancelar assinatura</p>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input id="reason" name="reason" maxLength={500} />
              </div>
              {cancelState && !cancelState.ok ? (
                <Alert variant="destructive">
                  <AlertDescription>{cancelState.error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" variant="destructive" disabled={cancelPending}>
                {cancelPending ? "Cancelando..." : "Cancelar assinatura"}
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Esta empresa ainda não possui uma assinatura do BusinessOS One.
        </p>
      )}

      {showSubscribe || showRetry ? (
        <div className="space-y-4">
          <h3 className="font-medium">
            {status === "CANCELLED" ? "Contratar novamente" : "Contratar"}
          </h3>
          {subscribeState && !subscribeState.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{subscribeState.error}</AlertDescription>
            </Alert>
          ) : null}
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano ativo.</p>
          ) : (
            plans.map((plan) => (
              <form key={plan.id} action={subscribeFormAction} className="rounded-md border p-4">
                <input type="hidden" name="planId" value={plan.id} />
                <div className="mb-3">
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoneyBRL(plan.price)} / {PLAN_INTERVAL_LABELS[plan.interval].toLowerCase()}
                  </p>
                  {plan.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  ) : null}
                </div>
                <Button type="submit" disabled={subscribePending || !canManage}>
                  {subscribePending ? "Iniciando..." : "Iniciar cobrança"}
                </Button>
              </form>
            ))
          )}
        </div>
      ) : null}

      {!canManage && role !== "ADMIN" ? (
        <p className="text-xs text-muted-foreground">
          Somente administradores e gestores podem alterar a cobrança da empresa.
        </p>
      ) : null}
    </div>
  );
}
