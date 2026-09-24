import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import type { LeadFormInput, LeadListQuery } from "@/modules/crm/schemas/lead.schemas";
import { assertPlanLimit } from "@/modules/billing/services/entitlements.service";
import {
  createLead,
  findLeadById,
  findLeads,
  listCompanyOwners,
  softDeleteLead,
  updateLead,
} from "@/modules/crm/repositories/lead.repository";

export function canViewLeads(role: Role): boolean {
  return hasPermission(role, "crm:leads:view");
}

export function canManageLeads(role: Role): boolean {
  return hasPermission(role, "crm:leads:manage");
}

async function assertOwnerInTenant(companyId: string, ownerId: string | null) {
  if (!ownerId) return;
  const owners = await listCompanyOwners(companyId);
  const valid = owners.some((m) => m.userId === ownerId);
  if (!valid) {
    throw new Error("Responsável inválido para esta empresa");
  }
}

export async function listLeadsForTenant(params: {
  companyId: string;
  role: Role;
  query: LeadListQuery;
}) {
  assertPermission(params.role, "crm:leads:view");
  return findLeads({
    companyId: params.companyId,
    ...params.query,
  });
}

export async function getLeadForTenant(params: {
  companyId: string;
  role: Role;
  leadId: string;
}) {
  assertPermission(params.role, "crm:leads:view");
  return findLeadById({
    companyId: params.companyId,
    leadId: params.leadId,
  });
}

export async function createLeadForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: LeadFormInput;
}) {
  assertPermission(params.role, "crm:leads:manage");
  await assertPlanLimit({ companyId: params.companyId, feature: "leads" });
  await assertOwnerInTenant(params.companyId, params.data.ownerId);

  const lead = await createLead({
    companyId: params.companyId,
    data: params.data,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "LEAD_CREATE",
    entity: "Lead",
    entityId: lead.id,
    metadata: {
      name: lead.name,
      status: lead.status,
      origin: lead.origin,
    },
  });

  return lead;
}

export async function updateLeadForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  leadId: string;
  data: LeadFormInput;
}) {
  assertPermission(params.role, "crm:leads:manage");
  await assertOwnerInTenant(params.companyId, params.data.ownerId);

  const existing = await findLeadById({
    companyId: params.companyId,
    leadId: params.leadId,
  });
  if (!existing) {
    throw new Error("Lead não encontrado");
  }

  const lead = await updateLead({
    companyId: params.companyId,
    leadId: params.leadId,
    data: params.data,
  });
  if (!lead) {
    throw new Error("Lead não encontrado");
  }

  const statusChanged = existing.status !== lead.status;
  const ownerChanged = existing.ownerId !== lead.ownerId;

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: statusChanged
      ? "LEAD_STATUS_CHANGE"
      : ownerChanged
        ? "LEAD_OWNER_CHANGE"
        : "LEAD_UPDATE",
    entity: "Lead",
    entityId: lead.id,
    metadata: {
      name: lead.name,
      status: lead.status,
      previousStatus: existing.status,
      ownerId: lead.ownerId,
      previousOwnerId: existing.ownerId,
    },
  });

  return lead;
}

export async function deleteLeadForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  leadId: string;
}) {
  assertPermission(params.role, "crm:leads:manage");

  const lead = await softDeleteLead({
    companyId: params.companyId,
    leadId: params.leadId,
  });
  if (!lead) {
    throw new Error("Lead não encontrado");
  }

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "LEAD_DELETE",
    entity: "Lead",
    entityId: lead.id,
    metadata: { name: lead.name },
  });

  return lead;
}

export async function getLeadFormMeta(companyId: string) {
  const owners = await listCompanyOwners(companyId);
  return {
    owners: owners.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
  };
}
