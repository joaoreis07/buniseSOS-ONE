import type { CommunicationOrigin, CommunicationType, Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { toCsv, csvFilename } from "@/modules/reports/lib/csv";
import { getCommunicationProvider } from "@/modules/communications/lib/provider";
import {
  pickCustomerWhatsApp,
  toWhatsAppNumber,
} from "@/modules/communications/lib/whatsapp";
import {
  assertTemplatePublishable,
  renderTemplate,
  type TemplateValues,
  unknownTemplateVariables,
} from "@/modules/communications/lib/template-engine";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_ORIGIN_LABELS,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import type {
  CommunicationListQuery,
  PrepareCommunicationInput,
  RecordManualCommunicationInput,
  TemplateFormInput,
} from "@/modules/communications/schemas/communication.schemas";
import {
  createCommunication,
  createTemplate,
  findCommunicationById,
  findCommunications,
  findTemplateById,
  findTemplates,
  listCommunicationAuthors,
  listCommunicationCustomers,
  listCommunicationsForCustomer,
  setTemplateActive,
  updateCommunicationStatus,
  updateTemplate,
} from "@/modules/communications/repositories/communication.repository";

export function canViewCommunications(role: Role) {
  return hasPermission(role, "communications:view");
}

export function canSendCommunications(role: Role) {
  return hasPermission(role, "communications:send");
}

export function canManageTemplates(role: Role) {
  return hasPermission(role, "communications:templates");
}

function originFromIntent(
  intent: PrepareCommunicationInput["intent"],
): CommunicationOrigin {
  if (intent === "sale") return "SALE";
  if (intent === "charge") return "FINANCE";
  if (intent === "followup") return "CRM";
  return "MANUAL";
}

function typeFromIntent(
  intent: PrepareCommunicationInput["intent"],
): CommunicationType {
  if (intent === "sale") return "TRANSACTIONAL";
  if (intent === "charge") return "REMINDER";
  if (intent === "followup") return "FOLLOW_UP";
  return "MANUAL";
}

async function loadCompanyName(companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, ...notDeletedFilter },
    select: { name: true },
  });
  return company?.name ?? "Empresa";
}

async function loadCustomer(companyId: string, customerId: string | null | undefined) {
  if (!customerId) return null;
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, ...notDeletedFilter },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      mobile: true,
      whatsapp: true,
    },
  });
  if (!customer) throw new Error("Cliente inválido para esta empresa");
  return customer;
}

async function loadSale(companyId: string, saleId: string | null | undefined) {
  if (!saleId) return null;
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    select: {
      id: true,
      number: true,
      total: true,
      completedAt: true,
      createdAt: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          mobile: true,
          whatsapp: true,
        },
      },
    },
  });
  if (!sale) throw new Error("Venda inválida para esta empresa");
  return sale;
}

async function loadInstallment(
  companyId: string,
  installmentId: string | null | undefined,
) {
  if (!installmentId) return null;
  const installment = await prisma.installment.findFirst({
    where: { id: installmentId, companyId },
    select: {
      id: true,
      number: true,
      amount: true,
      remainingAmount: true,
      dueDate: true,
      accountReceivable: {
        select: {
          id: true,
          remainingAmount: true,
          customerId: true,
          sale: { select: { id: true, number: true, total: true, completedAt: true, createdAt: true } },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              mobile: true,
              whatsapp: true,
            },
          },
        },
      },
    },
  });
  if (!installment) throw new Error("Parcela inválida para esta empresa");
  return installment;
}

async function loadActivity(companyId: string, activityId: string | null | undefined) {
  if (!activityId) return null;
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, companyId, ...notDeletedFilter },
    select: {
      id: true,
      title: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          mobile: true,
          whatsapp: true,
        },
      },
    },
  });
  if (!activity) throw new Error("Atividade inválida para esta empresa");
  return activity;
}

export async function buildTemplateValues(params: {
  companyId: string;
  customerId?: string | null;
  saleId?: string | null;
  installmentId?: string | null;
}): Promise<{
  values: TemplateValues;
  customer: Awaited<ReturnType<typeof loadCustomer>>;
  sale: Awaited<ReturnType<typeof loadSale>>;
  installment: Awaited<ReturnType<typeof loadInstallment>>;
}> {
  const [companyName, sale, installment, customerDirect] = await Promise.all([
    loadCompanyName(params.companyId),
    loadSale(params.companyId, params.saleId),
    loadInstallment(params.companyId, params.installmentId),
    loadCustomer(params.companyId, params.customerId),
  ]);

  const customer =
    customerDirect ??
    installment?.accountReceivable.customer ??
    sale?.customer ??
    null;

  const values: TemplateValues = {
    "company.name": companyName,
    "customer.name": customer?.name,
    "customer.phone": customer?.phone ?? customer?.mobile ?? undefined,
    "customer.whatsapp": customer?.whatsapp ?? customer?.mobile ?? customer?.phone ?? undefined,
    "customer.email": customer?.email ?? undefined,
  };

  const saleRecord = sale ?? installment?.accountReceivable.sale ?? null;
  if (saleRecord) {
    values["sale.number"] = formatSaleNumber(saleRecord.number);
    values["sale.total"] = formatMoneyBRL(saleRecord.total);
    values["sale.date"] = formatDateBR(saleRecord.completedAt ?? saleRecord.createdAt);
  }

  if (installment) {
    values["installment.number"] = String(installment.number);
    values["installment.dueDate"] = formatDateBR(installment.dueDate);
    values["installment.remaining"] = formatMoneyBRL(installment.remainingAmount);
    values["installment.amount"] = formatMoneyBRL(installment.amount);
    values["finance.remaining"] = formatMoneyBRL(
      installment.accountReceivable.remainingAmount,
    );
  }

  return { values, customer, sale, installment };
}

export async function listTemplatesForTenant(params: {
  companyId: string;
  role: Role;
  active?: boolean;
}) {
  assertPermission(params.role, "communications:view");
  return findTemplates({ companyId: params.companyId, active: params.active });
}

export async function getTemplateForTenant(params: {
  companyId: string;
  role: Role;
  templateId: string;
}) {
  assertPermission(params.role, "communications:view");
  return findTemplateById(params);
}

export async function createTemplateForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: TemplateFormInput;
}) {
  assertPermission(params.role, "communications:templates");
  assertTemplatePublishable(params.data.body);
  if (params.data.subject) assertTemplatePublishable(params.data.subject);
  const template = await createTemplate({
    companyId: params.companyId,
    data: params.data,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: "TEMPLATE_CREATED",
    entity: "CommunicationTemplate",
    entityId: template.id,
    metadata: { name: template.name, channel: template.channel },
  });
  return template;
}

export async function updateTemplateForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  templateId: string;
  data: TemplateFormInput;
}) {
  assertPermission(params.role, "communications:templates");
  assertTemplatePublishable(params.data.body);
  if (params.data.subject) assertTemplatePublishable(params.data.subject);
  const template = await updateTemplate({
    companyId: params.companyId,
    templateId: params.templateId,
    data: params.data,
  });
  if (!template) throw new Error("Template não encontrado");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: "TEMPLATE_UPDATED",
    entity: "CommunicationTemplate",
    entityId: template.id,
    metadata: { name: template.name, active: template.active },
  });
  return template;
}

export async function setTemplateActiveForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  templateId: string;
  active: boolean;
}) {
  assertPermission(params.role, "communications:templates");
  const existing = await findTemplateById(params);
  if (!existing) throw new Error("Template não encontrado");
  if (params.active) {
    assertTemplatePublishable(existing.body);
  }
  const template = await setTemplateActive(params);
  if (!template) throw new Error("Template não encontrado");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: params.active ? "TEMPLATE_UPDATED" : "TEMPLATE_DEACTIVATED",
    entity: "CommunicationTemplate",
    entityId: template.id,
    metadata: { name: template.name, active: template.active },
  });
  return template;
}

export async function previewTemplateForTenant(params: {
  companyId: string;
  role: Role;
  body: string;
  subject?: string | null;
  customerId?: string | null;
  saleId?: string | null;
  installmentId?: string | null;
}) {
  assertPermission(params.role, "communications:view");
  const unknown = unknownTemplateVariables(
    `${params.subject ?? ""}\n${params.body}`,
  );
  const { values } = await buildTemplateValues(params);
  const rendered = renderTemplate(params.body, values);
  return {
    unknown,
    text: rendered.text,
    missing: rendered.missing,
    values,
  };
}

export async function listCommunicationsForTenant(params: {
  companyId: string;
  role: Role;
  query: CommunicationListQuery;
}) {
  assertPermission(params.role, "communications:view");
  const [result, customers, authors] = await Promise.all([
    findCommunications({ companyId: params.companyId, ...params.query }),
    listCommunicationCustomers(params.companyId),
    listCommunicationAuthors(params.companyId),
  ]);
  return { ...result, customers, authors };
}

export async function getCommunicationForTenant(params: {
  companyId: string;
  role: Role;
  communicationId: string;
}) {
  assertPermission(params.role, "communications:view");
  return findCommunicationById(params);
}

export async function listCustomerCommunicationsForTenant(params: {
  companyId: string;
  role: Role;
  customerId: string;
  take?: number;
}) {
  assertPermission(params.role, "communications:view");
  return listCommunicationsForCustomer(params);
}

export async function getComposeContextForTenant(params: {
  companyId: string;
  role: Role;
  customerId?: string | null;
  saleId?: string | null;
  installmentId?: string | null;
  activityId?: string | null;
  templateId?: string | null;
  intent?: PrepareCommunicationInput["intent"];
}) {
  assertPermission(params.role, "communications:view");
  const activity = await loadActivity(params.companyId, params.activityId);
  const { values, customer, sale, installment } = await buildTemplateValues({
    companyId: params.companyId,
    customerId: params.customerId ?? activity?.customerId,
    saleId: params.saleId,
    installmentId: params.installmentId,
  });
  const templates = await findTemplates({
    companyId: params.companyId,
    active: true,
    channel: "WHATSAPP",
  });

  const preferredType = typeFromIntent(params.intent);
  const selected =
    (params.templateId
      ? templates.find((item) => item.id === params.templateId)
      : null) ??
    templates.find((item) => item.type === preferredType) ??
    templates[0] ??
    null;

  const rendered = selected
    ? renderTemplate(selected.body, values)
    : { text: "", unknown: [] as string[], missing: [] as string[] };

  return {
    customer,
    sale,
    installment,
    activity,
    templates,
    selectedTemplate: selected,
    values,
    preview: rendered.text,
    unknown: rendered.unknown,
    missing: rendered.missing,
    recipient: customer ? pickCustomerWhatsApp(customer) : null,
    origin: activity ? "ACTIVITY" as const : originFromIntent(params.intent),
    type: selected?.type ?? preferredType,
  };
}

export async function prepareWhatsAppForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: PrepareCommunicationInput;
}) {
  assertPermission(params.role, "communications:send");
  assertTemplatePublishable(params.data.body);

  const activity = await loadActivity(params.companyId, params.data.activityId);
  const { values, customer, sale, installment } = await buildTemplateValues({
    companyId: params.companyId,
    customerId: params.data.customerId ?? activity?.customerId,
    saleId: params.data.saleId,
    installmentId: params.data.installmentId,
  });

  if (params.data.templateId) {
    const template = await findTemplateById({
      companyId: params.companyId,
      templateId: params.data.templateId,
    });
    if (!template || !template.active) {
      throw new Error("Template inválido ou inativo");
    }
    assertTemplatePublishable(template.body);
  }

  const rendered = renderTemplate(params.data.body, values);
  if (rendered.unknown.length > 0) {
    throw new Error(
      `Variável inválida: ${rendered.unknown.map((name) => `{{${name}}}`).join(", ")}`,
    );
  }

  const recipient =
    params.data.recipient ?? (customer ? pickCustomerWhatsApp(customer) : null);
  if (!recipient) {
    throw new Error("Cliente sem número de WhatsApp válido");
  }

  const prepared = getCommunicationProvider("WHATSAPP").prepare({
    recipient,
    body: rendered.text,
  });
  if (prepared.claimedSent) {
    throw new Error("O provedor manual não pode marcar mensagem como enviada");
  }

  const communication = await createCommunication({
    companyId: params.companyId,
    userId: params.userId,
    customerId: customer?.id ?? null,
    templateId: params.data.templateId,
    activityId: activity?.id ?? null,
    saleId: sale?.id ?? installment?.accountReceivable.sale.id ?? params.data.saleId ?? null,
    installmentId: installment?.id ?? params.data.installmentId ?? null,
    channel: "WHATSAPP",
    type: params.data.type ?? typeFromIntent(params.data.intent),
    origin: activity ? "ACTIVITY" : (params.data.origin ?? originFromIntent(params.data.intent)),
    status: "PREPARED",
    subject: params.data.subject,
    body: prepared.body,
    recipient: prepared.recipient,
    externalId: prepared.externalId,
    preparedAt: new Date(),
    sentAt: null,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: "COMMUNICATION_PREPARED",
    entity: "Communication",
    entityId: communication.id,
    metadata: {
      channel: "WHATSAPP",
      customerId: customer?.id ?? null,
      claimedSent: false,
    },
  });

  return {
    communication,
    url: prepared.externalId,
    claimedSent: false as const,
  };
}

export async function recordManualCommunicationForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: RecordManualCommunicationInput;
}) {
  assertPermission(params.role, "communications:send");
  const customer = await loadCustomer(params.companyId, params.data.customerId);
  if (!customer) throw new Error("Cliente inválido para esta empresa");
  const activity = await loadActivity(params.companyId, params.data.activityId);

  if (params.data.channel === "WHATSAPP" && params.data.recipient) {
    const phone = toWhatsAppNumber(params.data.recipient);
    if (!phone) throw new Error("Número de WhatsApp inválido");
  }

  const communication = await createCommunication({
    companyId: params.companyId,
    userId: params.userId,
    customerId: customer.id,
    activityId: activity?.id ?? null,
    channel: params.data.channel,
    type: params.data.type,
    origin: activity ? "ACTIVITY" : "MANUAL",
    status: "OPENED",
    subject: params.data.subject,
    body: params.data.body,
    recipient:
      params.data.channel === "WHATSAPP"
        ? toWhatsAppNumber(params.data.recipient ?? pickCustomerWhatsApp(customer))
        : params.data.recipient,
    openedAt: new Date(),
    sentAt: null,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: "COMMUNICATION_CREATED",
    entity: "Communication",
    entityId: communication.id,
    metadata: { channel: params.data.channel, claimedSent: false },
  });

  return communication;
}

export async function openPreparedCommunicationForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  communicationId: string;
}) {
  assertPermission(params.role, "communications:send");
  const existing = await findCommunicationById(params);
  if (!existing) throw new Error("Comunicação não encontrada");
  if (existing.status === "CANCELLED") {
    throw new Error("Comunicação cancelada");
  }
  if (existing.status === "SENT" || existing.status === "DELIVERED") {
    throw new Error("Esta comunicação já possui confirmação de envio externo");
  }

  const updated = await updateCommunicationStatus({
    companyId: params.companyId,
    communicationId: existing.id,
    status: "OPENED",
    openedAt: existing.openedAt ?? new Date(),
    sentAt: null,
  });
  if (!updated) throw new Error("Comunicação não encontrada");

  return {
    communication: updated,
    url: updated.externalId,
    claimedSent: false as const,
  };
}

export async function cancelCommunicationForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  communicationId: string;
}) {
  assertPermission(params.role, "communications:send");
  const existing = await findCommunicationById(params);
  if (!existing) throw new Error("Comunicação não encontrada");
  if (existing.status === "SENT" || existing.status === "DELIVERED") {
    throw new Error("Não é possível cancelar uma comunicação já enviada");
  }
  const updated = await updateCommunicationStatus({
    companyId: params.companyId,
    communicationId: existing.id,
    status: "CANCELLED",
  });
  if (!updated) throw new Error("Comunicação não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: "COMMUNICATION_CANCELLED",
    entity: "Communication",
    entityId: updated.id,
  });
  return updated;
}

export async function exportCommunicationsCsv(params: {
  companyId: string;
  userId: string;
  role: Role;
  query: CommunicationListQuery;
}) {
  assertPermission(params.role, "communications:view");
  const result = await findCommunications({
    companyId: params.companyId,
    ...params.query,
    page: 1,
    pageSize: 50,
  });
  const csv = toCsv(
    ["Data", "Cliente", "Canal", "Tipo", "Status", "Origem", "Responsável", "Assunto", "Destinatário"],
    result.items.map((item) => [
      item.createdAt.toISOString(),
      item.customer?.name ?? "",
      COMMUNICATION_CHANNEL_LABELS[item.channel],
      COMMUNICATION_TYPE_LABELS[item.type],
      COMMUNICATION_STATUS_LABELS[item.status],
      COMMUNICATION_ORIGIN_LABELS[item.origin],
      item.user.name ?? item.user.email ?? "",
      item.subject ?? "",
      item.recipient ?? "",
    ]),
  );
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "communications",
    action: "COMMUNICATION_EXPORTED",
    entity: "Communication",
    metadata: { count: result.items.length },
  });
  return { csv, filename: csvFilename("comunicacoes") };
}
