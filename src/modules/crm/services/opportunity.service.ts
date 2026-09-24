import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import type {
  OpportunityFormInput,
  OpportunityListQuery,
} from "@/modules/crm/schemas/opportunity.schemas";
import { assertPlanLimit } from "@/modules/billing/services/entitlements.service";
import {
  assertCustomerInTenant,
  assertLeadInTenant,
  createOpportunity,
  findOpportunityById,
  findOpportunities,
  listCompanyOwners,
  listTenantCustomers,
  listTenantLeads,
  softDeleteOpportunity,
  updateOpportunity,
} from "@/modules/crm/repositories/opportunity.repository";

export function canViewOpportunities(role: Role): boolean {
  return hasPermission(role, "crm:opportunities:view");
}

export function canManageOpportunities(role: Role): boolean {
  return hasPermission(role, "crm:opportunities:manage");
}

async function assertRelationsInTenant(
  companyId: string,
  data: OpportunityFormInput,
) {
  if (data.ownerId) {
    const owners = await listCompanyOwners(companyId);
    const valid = owners.some((m) => m.userId === data.ownerId);
    if (!valid) {
      throw new Error("Responsável inválido para esta empresa");
    }
  }

  if (data.leadId) {
    const lead = await assertLeadInTenant({
      companyId,
      leadId: data.leadId,
    });
    if (!lead) {
      throw new Error("Lead inválido para esta empresa");
    }
  }

  if (data.customerId) {
    const customer = await assertCustomerInTenant({
      companyId,
      customerId: data.customerId,
    });
    if (!customer) {
      throw new Error("Cliente inválido para esta empresa");
    }
  }
}

export async function listOpportunitiesForTenant(params: {
  companyId: string;
  role: Role;
  query: OpportunityListQuery;
}) {
  assertPermission(params.role, "crm:opportunities:view");
  return findOpportunities({
    companyId: params.companyId,
    ...params.query,
  });
}

export async function getOpportunityForTenant(params: {
  companyId: string;
  role: Role;
  opportunityId: string;
}) {
  assertPermission(params.role, "crm:opportunities:view");
  return findOpportunityById({
    companyId: params.companyId,
    opportunityId: params.opportunityId,
  });
}

export async function createOpportunityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: OpportunityFormInput;
}) {
  assertPermission(params.role, "crm:opportunities:manage");
  await assertPlanLimit({ companyId: params.companyId, feature: "opportunities" });
  await assertRelationsInTenant(params.companyId, params.data);

  const opportunity = await createOpportunity({
    companyId: params.companyId,
    data: params.data,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "OPPORTUNITY_CREATE",
    entity: "Opportunity",
    entityId: opportunity.id,
    metadata: {
      name: opportunity.name,
      stage: opportunity.stage,
      leadId: opportunity.leadId,
      customerId: opportunity.customerId,
    },
  });

  return opportunity;
}

export async function updateOpportunityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  opportunityId: string;
  data: OpportunityFormInput;
}) {
  assertPermission(params.role, "crm:opportunities:manage");
  await assertRelationsInTenant(params.companyId, params.data);

  const existing = await findOpportunityById({
    companyId: params.companyId,
    opportunityId: params.opportunityId,
  });
  if (!existing) {
    throw new Error("Oportunidade não encontrada");
  }

  const opportunity = await updateOpportunity({
    companyId: params.companyId,
    opportunityId: params.opportunityId,
    data: params.data,
  });
  if (!opportunity) {
    throw new Error("Oportunidade não encontrada");
  }

  const stageChanged = existing.stage !== opportunity.stage;
  const ownerChanged = existing.ownerId !== opportunity.ownerId;

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: stageChanged
      ? "OPPORTUNITY_STAGE_CHANGE"
      : ownerChanged
        ? "OPPORTUNITY_OWNER_CHANGE"
        : "OPPORTUNITY_UPDATE",
    entity: "Opportunity",
    entityId: opportunity.id,
    metadata: {
      name: opportunity.name,
      stage: opportunity.stage,
      previousStage: existing.stage,
      ownerId: opportunity.ownerId,
      previousOwnerId: existing.ownerId,
    },
  });

  return opportunity;
}

export async function deleteOpportunityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  opportunityId: string;
}) {
  assertPermission(params.role, "crm:opportunities:manage");

  const opportunity = await softDeleteOpportunity({
    companyId: params.companyId,
    opportunityId: params.opportunityId,
  });
  if (!opportunity) {
    throw new Error("Oportunidade não encontrada");
  }

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "OPPORTUNITY_DELETE",
    entity: "Opportunity",
    entityId: opportunity.id,
    metadata: { name: opportunity.name },
  });

  return opportunity;
}

export async function getOpportunityFormMeta(companyId: string) {
  const [owners, leads, customers] = await Promise.all([
    listCompanyOwners(companyId),
    listTenantLeads(companyId),
    listTenantCustomers(companyId),
  ]);

  return {
    owners: owners.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
    leads,
    customers,
  };
}
