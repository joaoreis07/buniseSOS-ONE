import type { PlanInterval, SubscriptionStatus } from "@prisma/client";

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: "Pagamento pendente",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento em atraso",
  CANCELLED: "Cancelada",
};

export const PLAN_INTERVAL_LABELS: Record<PlanInterval, string> = {
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

export const BILLING_PRODUCT_LABELS = {
  ONE: "BusinessOS One",
  FINANCE: "BusinessOS Finance",
  ODONTO: "BusinessOS Odonto",
} as const;
