import type { OpportunityStage, Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type {
  OpportunityFormInput,
  OpportunityListQuery,
} from "@/modules/crm/schemas/opportunity.schemas";

function toOpportunityData(input: OpportunityFormInput) {
  return {
    name: input.name.trim(),
    leadId: input.leadId,
    customerId: input.customerId,
    ownerId: input.ownerId,
    stage: input.stage,
    estimatedValue: input.estimatedValue,
    probability: input.probability,
    expectedCloseDate: input.expectedCloseDate
      ? new Date(`${input.expectedCloseDate}T12:00:00.000Z`)
      : null,
    notes: input.notes,
  };
}

export type OpportunityListFilters = OpportunityListQuery & {
  companyId: string;
};

export async function findOpportunities(filters: OpportunityListFilters) {
  const where: Prisma.OpportunityWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  if (filters.stage) {
    where.stage = filters.stage as OpportunityStage;
  }
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }
  if (filters.leadId) {
    where.leadId = filters.leadId;
  }
  if (filters.customerId) {
    where.customerId = filters.customerId;
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
      { notes: { contains: q, mode: "insensitive" } },
      { lead: { name: { contains: q, mode: "insensitive" } } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.findMany({
      where,
      orderBy: [{ expectedCloseDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
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

export async function findOpportunityById(params: {
  companyId: string;
  opportunityId: string;
}) {
  return prisma.opportunity.findFirst({
    where: {
      id: params.opportunityId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createOpportunity(params: {
  companyId: string;
  data: OpportunityFormInput;
}) {
  return prisma.opportunity.create({
    data: {
      companyId: params.companyId,
      ...toOpportunityData(params.data),
    },
  });
}

export async function updateOpportunity(params: {
  companyId: string;
  opportunityId: string;
  data: OpportunityFormInput;
}) {
  const existing = await findOpportunityById({
    companyId: params.companyId,
    opportunityId: params.opportunityId,
  });
  if (!existing) return null;

  return prisma.opportunity.update({
    where: { id: existing.id },
    data: toOpportunityData(params.data),
  });
}

export async function softDeleteOpportunity(params: {
  companyId: string;
  opportunityId: string;
}) {
  const existing = await findOpportunityById({
    companyId: params.companyId,
    opportunityId: params.opportunityId,
  });
  if (!existing) return null;

  return prisma.opportunity.update({
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

export async function listTenantLeads(companyId: string) {
  return prisma.lead.findMany({
    where: { companyId, ...notDeletedFilter },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function listTenantCustomers(companyId: string) {
  return prisma.customer.findMany({
    where: { companyId, ...notDeletedFilter },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function assertLeadInTenant(params: {
  companyId: string;
  leadId: string;
}) {
  return prisma.lead.findFirst({
    where: {
      id: params.leadId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    select: { id: true },
  });
}

export async function assertCustomerInTenant(params: {
  companyId: string;
  customerId: string;
}) {
  return prisma.customer.findFirst({
    where: {
      id: params.customerId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    select: { id: true },
  });
}
