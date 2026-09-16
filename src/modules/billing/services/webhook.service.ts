import { Prisma } from "@prisma/client";
import { writeAuditLog, writeSystemLog } from "@/shared/audit/audit";
import {
  BillingAuthError,
  BillingConfigError,
  BillingPayloadError,
} from "@/modules/billing/lib/errors";
import {
  isHandledAsaasEvent,
  mapAsaasSubscriptionStatus,
  paymentStatusLabel,
  statusFromPaymentEvent,
} from "@/modules/billing/lib/status";
import { assertAsaasWebhookToken } from "@/modules/billing/lib/webhook-auth";
import { applyExternalSubscriptionStatus } from "@/modules/billing/services/billing.service";
import { notifyBillingEvent } from "@/modules/communications/services/notification.service";
import {
  createWebhookEvent,
  findWebhookEventByExternalId,
  updateWebhookEvent,
} from "@/modules/billing/repositories/billing.repository";

const MAX_WEBHOOK_BYTES = 256 * 1024;

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonObject;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function payloadKind(event: string) {
  if (event.startsWith("PAYMENT_")) return "payment";
  if (event.startsWith("SUBSCRIPTION_")) return "subscription";
  return "unknown";
}

function parseDueDate(payment: JsonObject | null, subscription: JsonObject | null) {
  return (
    asString(payment?.dueDate) ??
    asString(subscription?.nextDueDate) ??
    null
  );
}

export async function ingestAsaasWebhook(params: {
  rawBody: string;
  token: string | null;
}) {
  assertAsaasWebhookToken(params.token);

  if (Buffer.byteLength(params.rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    throw new BillingPayloadError("Payload excede o tamanho permitido");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(params.rawBody);
  } catch {
    throw new BillingPayloadError();
  }

  const body = asObject(parsed);
  const externalId = asString(body?.id);
  const event = asString(body?.event);
  if (!body || !externalId || !event) {
    throw new BillingPayloadError();
  }

  return processAsaasWebhookEvent({
    externalId,
    event,
    body,
  });
}

export async function processAsaasWebhookEvent(params: {
  externalId: string;
  event: string;
  body: JsonObject;
}) {
  const existing = await findWebhookEventByExternalId(params.externalId);
  if (existing) {
    return { duplicate: true as const, eventId: existing.id, status: existing.status };
  }

  let stored;
  try {
    stored = await createWebhookEvent({
      externalId: params.externalId,
      eventType: params.event,
      payloadKind: payloadKind(params.event),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const again = await findWebhookEventByExternalId(params.externalId);
      return {
        duplicate: true as const,
        eventId: again?.id ?? params.externalId,
        status: again?.status ?? "PROCESSED",
      };
    }
    throw error;
  }

  if (!isHandledAsaasEvent(params.event)) {
    await updateWebhookEvent(stored.id, {
      status: "IGNORED",
      processedAt: new Date(),
    });
    return { duplicate: false as const, eventId: stored.id, status: "IGNORED" as const };
  }

  try {
    const result = await applyHandledEvent(params.event, params.body);
    await updateWebhookEvent(stored.id, {
      status: "PROCESSED",
      companyId: result.companyId,
      processedAt: new Date(),
    });
    return {
      duplicate: false as const,
      eventId: stored.id,
      status: "PROCESSED" as const,
      companyId: result.companyId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 180) : "Falha ao processar webhook";
    await updateWebhookEvent(stored.id, {
      status: "FAILED",
      processedAt: new Date(),
      error: message,
    });
    await writeSystemLog({
      level: "ERROR",
      module: "billing",
      message: "Falha ao processar webhook Asaas",
      metadata: { event: params.event, externalId: params.externalId },
    });
    throw error;
  }
}

async function applyHandledEvent(event: string, body: JsonObject) {
  const payment = asObject(body.payment);
  const subscription = asObject(body.subscription);
  const asaasSubscriptionId =
    asString(payment?.subscription) ?? asString(subscription?.id);
  const asaasCustomerId =
    asString(payment?.customer) ?? asString(subscription?.customer);
  const invoiceUrl = asString(payment?.invoiceUrl);
  const nextDueDate = parseDueDate(payment, subscription);

  if (event.startsWith("SUBSCRIPTION_")) {
    const deleted = event === "SUBSCRIPTION_DELETED" || Boolean(subscription?.deleted);
    const mapped = mapAsaasSubscriptionStatus(
      asString(subscription?.status),
      deleted || event === "SUBSCRIPTION_INACTIVATED",
    );
    const status =
      mapped ??
      (event === "SUBSCRIPTION_CREATED" || event === "SUBSCRIPTION_UPDATED"
        ? null
        : "CANCELLED");

    if (!asaasSubscriptionId) {
      return { companyId: null as string | null };
    }

    if (!status) {
      const updated = await applyExternalSubscriptionStatus({
        asaasSubscriptionId,
        status: "PENDING",
        invoiceUrl,
        nextDueDate,
        asaasCustomerId,
      });
      if (updated?.status === "CANCELLED") {
        return { companyId: updated.companyId };
      }
      if (updated && updated.status !== "ACTIVE" && updated.status !== "PAST_DUE") {
        await writeAuditLog({
          companyId: updated.companyId,
          module: "billing",
          action: "SUBSCRIPTION_UPDATED",
          entity: "Subscription",
          entityId: updated.id,
          metadata: { event },
        });
      }
      return { companyId: updated?.companyId ?? null };
    }

    const updated = await applyExternalSubscriptionStatus({
      asaasSubscriptionId,
      status,
      invoiceUrl,
      nextDueDate,
      lastPaymentStatus: status === "CANCELLED" ? "CANCELLED" : undefined,
      asaasCustomerId,
    });
    if (updated && status === "CANCELLED") {
      await writeAuditLog({
        companyId: updated.companyId,
        module: "billing",
        action: "SUBSCRIPTION_CANCELLED",
        entity: "Subscription",
        entityId: updated.id,
        metadata: { event },
      });
      await notifyBillingEvent({
        companyId: updated.companyId,
        subscriptionId: updated.id,
        title: "Assinatura cancelada",
        message: "A assinatura do BusinessOS One foi cancelada.",
      });
    }
    return { companyId: updated?.companyId ?? null };
  }

  if (!asaasSubscriptionId) {
    return { companyId: null as string | null };
  }

  const current = await applyExternalSubscriptionStatus({
    asaasSubscriptionId,
    status: "PENDING",
    invoiceUrl,
    nextDueDate,
    asaasCustomerId,
  });
  if (!current) return { companyId: null as string | null };

  const nextStatus = statusFromPaymentEvent(event, current.status);
  const lastPaymentAt =
    event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED"
      ? new Date()
      : current.lastPaymentAt;

  const updated = await applyExternalSubscriptionStatus({
    asaasSubscriptionId,
    status: nextStatus,
    invoiceUrl,
    nextDueDate,
    lastPaymentStatus: paymentStatusLabel(event),
    lastPaymentAt,
    asaasCustomerId,
  });
  if (!updated) return { companyId: current.companyId };

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    await writeAuditLog({
      companyId: updated.companyId,
      module: "billing",
      action: nextStatus === "ACTIVE" && current.status !== "ACTIVE"
        ? "SUBSCRIPTION_ACTIVATED"
        : "PAYMENT_CONFIRMED",
      entity: "Subscription",
      entityId: updated.id,
      metadata: { event },
    });
    await notifyBillingEvent({
      companyId: updated.companyId,
      subscriptionId: updated.id,
      title: current.status === "ACTIVE" ? "Pagamento confirmado" : "Assinatura ativada",
      message:
        current.status === "ACTIVE"
          ? "O pagamento da assinatura do BusinessOS One foi confirmado."
          : "A assinatura do BusinessOS One está ativa.",
    });
  } else if (event === "PAYMENT_OVERDUE") {
    await writeAuditLog({
      companyId: updated.companyId,
      module: "billing",
      action: "SUBSCRIPTION_PAST_DUE",
      entity: "Subscription",
      entityId: updated.id,
      metadata: { event },
    });
    await notifyBillingEvent({
      companyId: updated.companyId,
      subscriptionId: updated.id,
      title: "Pagamento vencido",
      message: "Há um pagamento da assinatura do BusinessOS One em atraso.",
    });
  } else if (event === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED") {
    await writeAuditLog({
      companyId: updated.companyId,
      module: "billing",
      action: "PAYMENT_FAILED",
      entity: "Subscription",
      entityId: updated.id,
      metadata: { event },
    });
  }

  return { companyId: updated.companyId };
}

export { BillingAuthError, BillingConfigError, BillingPayloadError };
