import type {
  BillingProduct,
  BillingWebhookEventStatus,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

export function findPlanById(id: string) {
  return prisma.plan.findUnique({ where: { id } });
}

export function findActivePlansByProduct(product: BillingProduct) {
  return prisma.plan.findMany({
    where: { product, active: true },
    orderBy: { price: "asc" },
  });
}

export function findCompanyForBilling(companyId: string) {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      tradeName: true,
      document: true,
      email: true,
      phone: true,
      whatsapp: true,
      zipCode: true,
      street: true,
      number: true,
      complement: true,
      district: true,
      city: true,
      state: true,
      asaasCustomerId: true,
    },
  });
}

export function findSubscriptionByCompanyProduct(
  companyId: string,
  product: BillingProduct,
) {
  return prisma.subscription.findUnique({
    where: { companyId_product: { companyId, product } },
    include: { plan: true },
  });
}

export function findSubscriptionByAsaasId(asaasSubscriptionId: string) {
  return prisma.subscription.findUnique({
    where: { asaasSubscriptionId },
    include: { plan: true },
  });
}

export function findCompanyByAsaasCustomerId(asaasCustomerId: string) {
  return prisma.company.findUnique({
    where: { asaasCustomerId },
    select: { id: true },
  });
}

export function saveCompanyAsaasCustomerId(params: {
  companyId: string;
  asaasCustomerId: string;
}) {
  return prisma.company.update({
    where: { id: params.companyId },
    data: { asaasCustomerId: params.asaasCustomerId },
    select: { id: true, asaasCustomerId: true },
  });
}

export function upsertSubscription(params: {
  companyId: string;
  product: BillingProduct;
  planId: string;
  data: Prisma.SubscriptionUncheckedCreateInput;
}) {
  return prisma.subscription.upsert({
    where: {
      companyId_product: { companyId: params.companyId, product: params.product },
    },
    create: params.data,
    update: {
      planId: params.planId,
      status: params.data.status,
      asaasCustomerId: params.data.asaasCustomerId,
      asaasSubscriptionId: params.data.asaasSubscriptionId,
      startedAt: params.data.startedAt,
      nextDueDate: params.data.nextDueDate,
      lastPaymentAt: params.data.lastPaymentAt,
      lastPaymentStatus: params.data.lastPaymentStatus,
      invoiceUrl: params.data.invoiceUrl,
      cancelledAt: params.data.cancelledAt,
      cancelReason: params.data.cancelReason,
      lastError: params.data.lastError,
    },
    include: { plan: true },
  });
}

export function updateSubscriptionById(
  id: string,
  data: Prisma.SubscriptionUncheckedUpdateInput,
) {
  return prisma.subscription.update({
    where: { id },
    data,
    include: { plan: true },
  });
}

export function createWebhookEvent(params: {
  externalId: string;
  eventType: string;
  payloadKind: string;
  companyId?: string | null;
  status?: BillingWebhookEventStatus;
}) {
  return prisma.billingWebhookEvent.create({
    data: {
      externalId: params.externalId,
      eventType: params.eventType,
      payloadKind: params.payloadKind,
      companyId: params.companyId ?? null,
      status: params.status ?? "RECEIVED",
    },
  });
}

export function findWebhookEventByExternalId(externalId: string) {
  return prisma.billingWebhookEvent.findUnique({
    where: { externalId },
  });
}

export function updateWebhookEvent(
  id: string,
  data: {
    status: BillingWebhookEventStatus;
    companyId?: string | null;
    processedAt?: Date | null;
    error?: string | null;
  },
) {
  return prisma.billingWebhookEvent.update({
    where: { id },
    data,
  });
}

export type SubscriptionUpdate = {
  status?: SubscriptionStatus;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  startedAt?: Date | null;
  nextDueDate?: Date | null;
  lastPaymentAt?: Date | null;
  lastPaymentStatus?: string | null;
  invoiceUrl?: string | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  lastError?: string | null;
};
