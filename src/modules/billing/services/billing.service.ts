import type { BillingProduct, Prisma, Role, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { lockTenantResource } from "@/shared/db/advisory-lock";
import { writeAuditLog, writeSystemLog } from "@/shared/audit/audit";
import { publicErrorMessage } from "@/shared/errors/public-error";
import { BillingConfigError, BillingError } from "@/modules/billing/lib/errors";
import { resolveBillingProviderName } from "@/modules/billing/lib/env";
import { decimalToAsaasValue } from "@/modules/billing/lib/money";
import {
  mapAsaasSubscriptionStatus,
  paymentStatusLabel,
} from "@/modules/billing/lib/status";
import { getBillingProvider } from "@/modules/billing/providers";
import type { BillingCustomerInput } from "@/modules/billing/providers/billing-provider";
import {
  assertCancelBilling,
  assertManageBilling,
  assertViewBilling,
} from "@/modules/billing/services/access.service";
import { notifyBillingEvent } from "@/modules/communications/services/notification.service";
import {
  findActivePlansByProduct,
  findCompanyForBilling,
  findPlanById,
  findSubscriptionByAsaasId,
  findSubscriptionByCompanyProduct,
  saveCompanyAsaasCustomerId,
  updateSubscriptionById,
} from "@/modules/billing/repositories/billing.repository";

function nextDueDateIso(days = 3) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseAsaasDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = value.length === 10 ? `${value}T12:00:00.000Z` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCustomerInput(
  company: NonNullable<Awaited<ReturnType<typeof findCompanyForBilling>>>,
): BillingCustomerInput {
  return {
    name: company.tradeName?.trim() || company.name,
    email: company.email,
    cpfCnpj: company.document,
    phone: company.phone,
    mobilePhone: company.whatsapp,
    postalCode: company.zipCode,
    address: company.street,
    addressNumber: company.number,
    complement: company.complement,
    province: company.district,
    externalReference: company.id,
  };
}

async function writeBillingAudit(params: {
  companyId: string;
  userId?: string | null;
  action: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId ?? null,
    module: "billing",
    action: params.action,
    entity: "Subscription",
    entityId: params.entityId ?? null,
    metadata: params.metadata,
  });
}

export async function ensureBillingCustomer(companyId: string) {
  const prepared = await prisma.$transaction(async (tx) => {
    await lockTenantResource(tx, "billing-customer", companyId);
    const company = await tx.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!company) throw new BillingError("Empresa não encontrada");
    if (company.asaasCustomerId) {
      return { kind: "existing" as const, asaasCustomerId: company.asaasCustomerId, company };
    }
    return { kind: "create" as const, company };
  });
  if (prepared.kind === "existing") {
    return { companyId, asaasCustomerId: prepared.asaasCustomerId, created: false };
  }

  const customer = await getBillingProvider().ensureCustomer(toCustomerInput(prepared.company));
  await prisma.$transaction(async (tx) => {
    await lockTenantResource(tx, "billing-customer", companyId);
    const latest = await tx.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { asaasCustomerId: true },
    });
    if (latest?.asaasCustomerId) return;
    await tx.company.update({
      where: { id: companyId },
      data: { asaasCustomerId: customer.id },
    });
  });
  const saved = await prisma.company.findFirst({
    where: { id: companyId },
    select: { asaasCustomerId: true },
  });
  return {
    companyId,
    asaasCustomerId: saved?.asaasCustomerId ?? customer.id,
    created: true,
  };
}

export async function listPlansForProduct(product: BillingProduct = "ONE") {
  return findActivePlansByProduct(product);
}

export async function getSubscriptionOverviewForTenant(params: {
  companyId: string;
  role: Role;
  product?: BillingProduct;
}) {
  assertViewBilling(params.role);
  const product = params.product ?? "ONE";
  const [subscription, plans, company] = await Promise.all([
    findSubscriptionByCompanyProduct(params.companyId, product),
    findActivePlansByProduct(product),
    findCompanyForBilling(params.companyId),
  ]);
  return {
    company,
    subscription,
    plans,
    provider: resolveBillingProviderName(),
  };
}

export async function createSubscriptionForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  planId: string;
  product?: BillingProduct;
}) {
  assertManageBilling(params.role);
  const product = params.product ?? "ONE";
  const plan = await findPlanById(params.planId);
  if (!plan || !plan.active || plan.product !== product) {
    throw new BillingError("Plano indisponível");
  }
  decimalToAsaasValue(plan.price);

  const prepared = await prisma.$transaction(async (tx) => {
    await lockTenantResource(tx, "billing-customer", params.companyId);
    await lockTenantResource(tx, "billing-subscription", `${params.companyId}:${product}`);
    const existing = await tx.subscription.findUnique({
      where: { companyId_product: { companyId: params.companyId, product } },
      include: { plan: true },
    });
    if (existing?.asaasSubscriptionId && existing.status !== "CANCELLED") {
      return { kind: "existing" as const, existing };
    }
    const company = await tx.company.findFirst({
      where: { id: params.companyId, deletedAt: null },
    });
    if (!company) throw new BillingError("Empresa não encontrada");
    return { kind: "create" as const, existing, company };
  });

  if (prepared.kind === "existing") return prepared.existing;

  const provider = getBillingProvider();
  if (provider.name === "asaas" && !process.env.ASAAS_API_KEY?.trim()) {
    throw new BillingConfigError();
  }

  try {
    let asaasCustomerId = prepared.company.asaasCustomerId;
    if (!asaasCustomerId) {
      const customer = await provider.ensureCustomer(toCustomerInput(prepared.company));
      asaasCustomerId = customer.id;
    }

    const remote = await provider.createSubscription({
      customerId: asaasCustomerId,
      value: plan.price.toFixed(2),
      nextDueDate: nextDueDateIso(),
      cycle: plan.interval,
      description: plan.name,
      externalReference: `${params.companyId}:${product}`,
      idempotencyKey: `sub:${params.companyId}:${product}:${plan.id}`,
    });

    const saved = await prisma.$transaction(async (tx) => {
      await lockTenantResource(tx, "billing-customer", params.companyId);
      await lockTenantResource(tx, "billing-subscription", `${params.companyId}:${product}`);
      await tx.company.update({
        where: { id: params.companyId },
        data: { asaasCustomerId },
      });
      const latest = await tx.subscription.findUnique({
        where: { companyId_product: { companyId: params.companyId, product } },
        include: { plan: true },
      });
      if (latest?.asaasSubscriptionId && latest.status !== "CANCELLED") {
        return latest;
      }
      const data = {
        companyId: params.companyId,
        planId: plan.id,
        product,
        status: "PENDING" as SubscriptionStatus,
        asaasCustomerId,
        asaasSubscriptionId: remote.id,
        startedAt: latest?.startedAt ?? new Date(),
        nextDueDate: parseAsaasDate(remote.nextDueDate),
        invoiceUrl: remote.invoiceUrl,
        lastPaymentStatus: "PENDING",
        cancelledAt: null,
        cancelReason: null,
        lastError: null,
      };
      return latest
        ? tx.subscription.update({
            where: { id: latest.id },
            data,
            include: { plan: true },
          })
        : tx.subscription.create({
            data,
            include: { plan: true },
          });
    });

    await writeBillingAudit({
      companyId: params.companyId,
      userId: params.userId,
      action: "SUBSCRIPTION_CREATED",
      entityId: saved.id,
      metadata: { planId: plan.id, product, provider: provider.name },
    });
    return saved;
  } catch (error) {
    const message = publicErrorMessage(error, "Não foi possível criar a cobrança. Tente novamente.");
    const existing = await findSubscriptionByCompanyProduct(params.companyId, product);
    if (existing) {
      await updateSubscriptionById(existing.id, {
        lastError: message,
        status: existing.status === "ACTIVE" ? existing.status : "PENDING",
      });
    } else {
      await prisma.subscription.create({
        data: {
          companyId: params.companyId,
          planId: plan.id,
          product,
          status: "PENDING",
          lastError: message,
        },
      }).catch(() => undefined);
    }
    await writeSystemLog({
      companyId: params.companyId,
      userId: params.userId,
      level: "ERROR",
      module: "billing",
      message: "Falha ao criar assinatura no provedor",
      metadata: { name: error instanceof Error ? error.name : "Error" },
    });
    throw new BillingError(message);
  }
}

export async function cancelSubscriptionForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  reason?: string | null;
  product?: BillingProduct;
}) {
  assertCancelBilling(params.role);
  const product = params.product ?? "ONE";

  const existing = await prisma.$transaction(async (tx) => {
    await lockTenantResource(tx, "billing-subscription", `${params.companyId}:${product}`);
    return tx.subscription.findUnique({
      where: { companyId_product: { companyId: params.companyId, product } },
      include: { plan: true },
    });
  });
  if (!existing) throw new BillingError("Assinatura não encontrada");
  if (existing.status === "CANCELLED") return existing;

  if (existing.asaasSubscriptionId) {
    try {
      await getBillingProvider().cancelSubscription(existing.asaasSubscriptionId);
    } catch (error) {
      const message = publicErrorMessage(error, "Não foi possível cancelar no provedor");
      await updateSubscriptionById(existing.id, { lastError: message });
      throw new BillingError(message);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await lockTenantResource(tx, "billing-subscription", `${params.companyId}:${product}`);
    const latest = await tx.subscription.findUnique({
      where: { id: existing.id },
      include: { plan: true },
    });
    if (!latest) throw new BillingError("Assinatura não encontrada");
    if (latest.status === "CANCELLED") return latest;
    return tx.subscription.update({
      where: { id: latest.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: params.reason?.trim() || null,
        lastError: null,
      },
      include: { plan: true },
    });
  });

  await writeBillingAudit({
    companyId: params.companyId,
    userId: params.userId,
    action: "SUBSCRIPTION_CANCELLED",
    entityId: updated.id,
    metadata: { reason: updated.cancelReason },
  });

  await notifyBillingEvent({
    companyId: params.companyId,
    actorUserId: params.userId,
    subscriptionId: updated.id,
    title: "Assinatura cancelada",
    message: "A assinatura do BusinessOS One foi cancelada.",
  });

  return updated;
}

export async function syncSubscriptionFromProvider(params: {
  companyId: string;
  role?: Role;
  product?: BillingProduct;
  userId?: string | null;
}) {
  if (params.role) assertManageBilling(params.role);
  const product = params.product ?? "ONE";
  const local = await findSubscriptionByCompanyProduct(params.companyId, product);
  if (!local?.asaasSubscriptionId) {
    throw new BillingError("Não há assinatura externa para sincronizar");
  }

  const remote = await getBillingProvider().getSubscription(local.asaasSubscriptionId);
  if (!remote) throw new BillingError("Assinatura não encontrada no provedor");

  const mapped = mapAsaasSubscriptionStatus(remote.status, remote.deleted);
  const payments = await getBillingProvider().listPaymentsBySubscription(remote.id);
  const latest = payments[0];
  let status: SubscriptionStatus = local.status;
  if (mapped) {
    status = mapped;
  } else if (latest) {
    const paymentStatus = latest.status.toUpperCase();
    if (paymentStatus === "CONFIRMED" || paymentStatus === "RECEIVED") status = "ACTIVE";
    else if (paymentStatus === "OVERDUE") status = "PAST_DUE";
    else if (local.status === "CANCELLED") status = "CANCELLED";
    else if (status === "ACTIVE") status = "ACTIVE";
    else status = "PENDING";
  }

  const updated = await updateSubscriptionById(local.id, {
    status,
    nextDueDate: parseAsaasDate(remote.nextDueDate),
    invoiceUrl: remote.invoiceUrl ?? latest?.invoiceUrl ?? local.invoiceUrl,
    lastPaymentStatus: latest ? paymentStatusLabel(`PAYMENT_${latest.status.toUpperCase()}`) : local.lastPaymentStatus,
    lastError: null,
    cancelledAt: status === "CANCELLED" ? local.cancelledAt ?? new Date() : local.cancelledAt,
  });

  await writeBillingAudit({
    companyId: params.companyId,
    userId: params.userId ?? null,
    action: "SUBSCRIPTION_UPDATED",
    entityId: updated.id,
    metadata: { source: "sync" },
  });

  return updated;
}

export async function applyExternalSubscriptionStatus(params: {
  asaasSubscriptionId: string;
  status: SubscriptionStatus;
  invoiceUrl?: string | null;
  nextDueDate?: string | null;
  lastPaymentStatus?: string | null;
  lastPaymentAt?: Date | null;
  asaasCustomerId?: string | null;
}) {
  const local =
    (await findSubscriptionByAsaasId(params.asaasSubscriptionId)) ??
    (params.asaasCustomerId
      ? await prisma.subscription.findFirst({
          where: { asaasCustomerId: params.asaasCustomerId },
          include: { plan: true },
        })
      : null);
  if (!local) return null;
  if (local.status === "CANCELLED" && params.status !== "CANCELLED") {
    return local;
  }

  const nextStatus =
    params.status === "PENDING" &&
    (local.status === "ACTIVE" || local.status === "PAST_DUE")
      ? local.status
      : params.status;

  const startedAt =
    nextStatus === "ACTIVE" && !local.startedAt ? new Date() : local.startedAt;

  return updateSubscriptionById(local.id, {
    status: nextStatus,
    invoiceUrl: params.invoiceUrl ?? local.invoiceUrl,
    nextDueDate: parseAsaasDate(params.nextDueDate) ?? local.nextDueDate,
    lastPaymentStatus: params.lastPaymentStatus ?? local.lastPaymentStatus,
    lastPaymentAt: params.lastPaymentAt ?? local.lastPaymentAt,
    startedAt,
    cancelledAt: params.status === "CANCELLED" ? local.cancelledAt ?? new Date() : local.cancelledAt,
    lastError: null,
  });
}

export { saveCompanyAsaasCustomerId };
