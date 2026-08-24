import type { LeadOrigin, LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type { LeadFormInput, LeadListQuery } from "@/modules/crm/schemas/lead.schemas";

function toLeadData(input: LeadFormInput) {
  return {
    name: input.name.trim(),
    companyName: input.companyName,
    email: input.email?.toLowerCase() ?? null,
    phone: input.phone,
    whatsapp: input.whatsapp,
    origin: input.origin,
    status: input.status,
    ownerId: input.ownerId,
    estimatedValue: input.estimatedValue,
    notes: input.notes,
  };
}

export type LeadListFilters = LeadListQuery & {
  companyId: string;
};

export async function findLeads(filters: LeadListFilters) {
  const where: Prisma.LeadWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  if (filters.status) {
    where.status = filters.status as LeadStatus;
  }
  if (filters.origin) {
    where.origin = filters.origin as LeadOrigin;
  }
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt.gte = new Date(`${filters.createdFrom}T00:00:00.000Z`);
    }
    if (filters.createdTo) {
      where.createdAt.lte = new Date(`${filters.createdTo}T23:59:59.999Z`);
    }
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      skip,
      take: filters.pageSize,
      include: {
        owner: { select: { id: true, name: true, email: true } },
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

export async function findLeadById(params: {
  companyId: string;
  leadId: string;
}) {
  return prisma.lead.findFirst({
    where: {
      id: params.leadId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createLead(params: {
  companyId: string;
  data: LeadFormInput;
}) {
  return prisma.lead.create({
    data: {
      companyId: params.companyId,
      ...toLeadData(params.data),
    },
  });
}

export async function updateLead(params: {
  companyId: string;
  leadId: string;
  data: LeadFormInput;
}) {
  const existing = await findLeadById({
    companyId: params.companyId,
    leadId: params.leadId,
  });
  if (!existing) return null;

  return prisma.lead.update({
    where: { id: existing.id },
    data: toLeadData(params.data),
  });
}

export async function softDeleteLead(params: {
  companyId: string;
  leadId: string;
}) {
  const existing = await findLeadById({
    companyId: params.companyId,
    leadId: params.leadId,
  });
  if (!existing) return null;

  return prisma.lead.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}

export async function listCompanyOwners(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId, ...notDeletedFilter },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
