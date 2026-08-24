import type { ActivityStatus, ActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type {
  ActivityFormInput,
  ActivityListQuery,
} from "@/modules/crm/schemas/activity.schemas";

function parseDueAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toActivityData(input: ActivityFormInput) {
  const status = input.status;
  return {
    title: input.title.trim(),
    description: input.description,
    type: input.type,
    status,
    ownerId: input.ownerId,
    dueAt: parseDueAt(input.dueAt),
    completedAt: status === "COMPLETED" ? new Date() : null,
    customerId: input.customerId,
    leadId: input.leadId,
    opportunityId: input.opportunityId,
  };
}

export type ActivityListFilters = ActivityListQuery & { companyId: string };

export async function findActivities(filters: ActivityListFilters) {
  const where: Prisma.ActivityWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  if (filters.status) where.status = filters.status as ActivityStatus;
  if (filters.type) where.type = filters.type as ActivityType;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.leadId) where.leadId = filters.leadId;
  if (filters.opportunityId) where.opportunityId = filters.opportunityId;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function findActivityById(params: {
  companyId: string;
  activityId: string;
}) {
  return prisma.activity.findFirst({
    where: {
      id: params.activityId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });
}

export async function createActivity(params: {
  companyId: string;
  data: ActivityFormInput;
}) {
  return prisma.activity.create({
    data: {
      companyId: params.companyId,
      ...toActivityData(params.data),
    },
  });
}

export async function updateActivity(params: {
  companyId: string;
  activityId: string;
  data: ActivityFormInput;
}) {
  const existing = await findActivityById(params);
  if (!existing) return null;
  return prisma.activity.update({
    where: { id: existing.id },
    data: toActivityData(params.data),
  });
}

export async function setActivityStatus(params: {
  companyId: string;
  activityId: string;
  status: ActivityStatus;
}) {
  const existing = await findActivityById(params);
  if (!existing) return null;
  return prisma.activity.update({
    where: { id: existing.id },
    data: {
      status: params.status,
      completedAt: params.status === "COMPLETED" ? new Date() : null,
    },
  });
}

export async function softDeleteActivity(params: {
  companyId: string;
  activityId: string;
}) {
  const existing = await findActivityById(params);
  if (!existing) return null;
  return prisma.activity.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}

export async function listRelatedActivities(params: {
  companyId: string;
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
  take?: number;
}) {
  return prisma.activity.findMany({
    where: {
      companyId: params.companyId,
      ...notDeletedFilter,
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.leadId ? { leadId: params.leadId } : {}),
      ...(params.opportunityId ? { opportunityId: params.opportunityId } : {}),
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: params.take ?? 10,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}
