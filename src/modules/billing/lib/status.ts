import type { SubscriptionStatus } from "@prisma/client";

export const HANDLED_ASAAS_EVENTS = [
  "PAYMENT_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_INACTIVATED",
  "SUBSCRIPTION_DELETED",
] as const;

export type HandledAsaasEvent = (typeof HANDLED_ASAAS_EVENTS)[number];

export function isHandledAsaasEvent(event: string): event is HandledAsaasEvent {
  return (HANDLED_ASAAS_EVENTS as readonly string[]).includes(event);
}

export function mapAsaasSubscriptionStatus(
  asaasStatus: string | null | undefined,
  deleted?: boolean | null,
): SubscriptionStatus | null {
  if (deleted) return "CANCELLED";
  const status = (asaasStatus ?? "").toUpperCase();
  if (status === "INACTIVE" || status === "EXPIRED") return "CANCELLED";
  if (status === "ACTIVE") return null;
  return null;
}

export function statusFromPaymentEvent(
  event: string,
  current: SubscriptionStatus,
): SubscriptionStatus {
  if (current === "CANCELLED") return "CANCELLED";
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    return "ACTIVE";
  }
  if (event === "PAYMENT_OVERDUE") return "PAST_DUE";
  if (event === "PAYMENT_CREATED") {
    return current === "ACTIVE" || current === "PAST_DUE" ? current : "PENDING";
  }
  if (event === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED") {
    return current === "ACTIVE" ? "ACTIVE" : current === "PAST_DUE" ? "PAST_DUE" : "PENDING";
  }
  return current;
}

export function subscriptionGrantsAccess(params: {
  status: SubscriptionStatus;
  graceUntil?: Date | null;
  now?: Date;
}): boolean {
  if (params.status === "ACTIVE") return true;
  if (params.status === "PAST_DUE") {
    // Grace exists as a field; without a commercial rule we do not suspend PAST_DUE.
    if (params.graceUntil && (params.now ?? new Date()) > params.graceUntil) {
      return true;
    }
    return true;
  }
  return false;
}

export function paymentStatusLabel(event: string): string {
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") return "CONFIRMED";
  if (event === "PAYMENT_OVERDUE") return "OVERDUE";
  if (event === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED") return "FAILED";
  if (event === "PAYMENT_CREATED") return "PENDING";
  return event;
}
