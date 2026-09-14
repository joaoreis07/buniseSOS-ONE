import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type { CommunicationListQuery } from "@/modules/communications/schemas/communication.schemas";
import { DEFAULT_COMMUNICATION_TEMPLATES } from "@/modules/communications/lib/defaults";

const communicationInclude = {
  customer: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
  template: { select: { id: true, name: true } },
} as const;

export async function ensureDefaultTemplates(companyId: string) {
  const count = await prisma.communicationTemplate.count({
    where: { companyId, ...notDeletedFilter },
  });
  if (count > 0) return;

  await prisma.communicationTemplate.createMany({
    data: DEFAULT_COMMUNICATION_TEMPLATES.map((template) => ({
      companyId,
      name: template.name,
      channel: template.channel,
      type: template.type,
      subject: template.subject,
      body: template.body,
      active: true,
    })),
  });
}

export async function findTemplates(params: {
  companyId: string;
  active?: boolean;
  channel?: CommunicationListQuery["channel"];
}) {
  await ensureDefaultTemplates(params.companyId);
  return prisma.communicationTemplate.findMany({
    where: {
      companyId: params.companyId,
      ...notDeletedFilter,
      ...(params.active == null ? {} : { active: params.active }),
      ...(params.channel ? { channel: params.channel } : {}),
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function findTemplateById(params: {
  companyId: string;
  templateId: string;
}) {
  return prisma.communicationTemplate.findFirst({
    where: {
      id: params.templateId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
  });
}

export async function createTemplate(params: {
  companyId: string;
  data: {
    name: string;
    channel: Prisma.CommunicationTemplateCreateInput["channel"];
    type: Prisma.CommunicationTemplateCreateInput["type"];
    subject: string | null;
    body: string;
    active: boolean;
  };
}) {
  return prisma.communicationTemplate.create({
    data: {
      companyId: params.companyId,
      name: params.data.name,
      channel: params.data.channel,
      type: params.data.type,
      subject: params.data.subject,
      body: params.data.body,
      active: params.data.active,
    },
  });
}

export async function updateTemplate(params: {
  companyId: string;
  templateId: string;
  data: {
    name: string;
    channel: Prisma.CommunicationTemplateUpdateInput["channel"];
    type: Prisma.CommunicationTemplateUpdateInput["type"];
    subject: string | null;
    body: string;
    active: boolean;
  };
}) {
  const existing = await findTemplateById(params);
  if (!existing) return null;
  return prisma.communicationTemplate.update({
    where: { id: existing.id },
    data: params.data,
  });
}

export async function setTemplateActive(params: {
  companyId: string;
  templateId: string;
  active: boolean;
}) {
  const existing = await findTemplateById(params);
  if (!existing) return null;
  return prisma.communicationTemplate.update({
    where: { id: existing.id },
    data: { active: params.active },
  });
}

function communicationWhere(
  companyId: string,
  query: CommunicationListQuery,
): Prisma.CommunicationWhereInput {
  const where: Prisma.CommunicationWhereInput = { companyId };
  if (query.customerId) where.customerId = query.customerId;
  if (query.userId) where.userId = query.userId;
  if (query.channel) where.channel = query.channel;
  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;
  if (query.origin) where.origin = query.origin;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(`${query.from}T00:00:00.000`);
    if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999`);
  }
  const q = query.q?.trim();
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { recipient: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function findCommunications(params: {
  companyId: string;
} & CommunicationListQuery) {
  const { companyId, ...query } = params;
  const where = communicationWhere(companyId, query);
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.communication.count({ where }),
    prisma.communication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: communicationInclude,
    }),
  ]);
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function findCommunicationById(params: {
  companyId: string;
  communicationId: string;
}) {
  return prisma.communication.findFirst({
    where: { id: params.communicationId, companyId: params.companyId },
    include: {
      ...communicationInclude,
      sale: { select: { id: true, number: true } },
      installment: { select: { id: true, number: true, dueDate: true } },
      activity: { select: { id: true, title: true } },
    },
  });
}

export async function listCommunicationsForCustomer(params: {
  companyId: string;
  customerId: string;
  take?: number;
}) {
  return prisma.communication.findMany({
    where: { companyId: params.companyId, customerId: params.customerId },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 10,
    include: communicationInclude,
  });
}

export async function createCommunication(
  data: Prisma.CommunicationUncheckedCreateInput,
) {
  return prisma.communication.create({
    data,
    include: communicationInclude,
  });
}

export async function updateCommunicationStatus(params: {
  companyId: string;
  communicationId: string;
  status: Prisma.CommunicationUpdateInput["status"];
  openedAt?: Date | null;
  sentAt?: Date | null;
}) {
  const existing = await prisma.communication.findFirst({
    where: { id: params.communicationId, companyId: params.companyId },
    select: { id: true, status: true },
  });
  if (!existing) return null;
  return prisma.communication.update({
    where: { id: existing.id },
    data: {
      status: params.status,
      openedAt: params.openedAt,
      sentAt: params.sentAt,
    },
    include: communicationInclude,
  });
}

export async function listCommunicationAuthors(companyId: string) {
  const rows = await prisma.communication.findMany({
    where: { companyId },
    distinct: ["userId"],
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });
  return rows.map((row) => row.user);
}

export async function listCommunicationCustomers(companyId: string) {
  return prisma.customer.findMany({
    where: { companyId, ...notDeletedFilter },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 300,
  });
}
