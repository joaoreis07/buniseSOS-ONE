import type { ActivityStatus, Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type {
  ActivityFormInput,
  ActivityListQuery,
} from "@/modules/crm/schemas/activity.schemas";
import {
  createActivity,
  findActivityById,
  findActivities,
  listRelatedActivities,
  setActivityStatus,
  softDeleteActivity,
  updateActivity,
} from "@/modules/crm/repositories/activity.repository";
import {
  assertCustomerInTenant,
  assertLeadInTenant,
  listCompanyOwners,
  listTenantCustomers,
  listTenantLeads,
} from "@/modules/crm/repositories/opportunity.repository";
import { notifyTaskAssigned } from "@/modules/communications/services/notification.service";

export function canViewActivities(role: Role): boolean {
  return hasPermission(role, "crm:activities:view");
}

export function canManageActivities(role: Role): boolean {
  return hasPermission(role, "crm:activities:manage");
}

async function assertActivityRelations(
  companyId: string,
  data: ActivityFormInput,
) {
  if (data.ownerId) {
    const owners = await listCompanyOwners(companyId);
    if (!owners.some((m) => m.userId === data.ownerId)) {
      throw new Error("Responsável inválido para esta empresa");
    }
  }
  if (data.customerId) {
    const customer = await assertCustomerInTenant({
      companyId,
      customerId: data.customerId,
    });
    if (!customer) throw new Error("Cliente inválido para esta empresa");
  }
  if (data.leadId) {
    const lead = await assertLeadInTenant({ companyId, leadId: data.leadId });
    if (!lead) throw new Error("Lead inválido para esta empresa");
  }
  if (data.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: data.opportunityId,
        companyId,
        ...notDeletedFilter,
      },
      select: { id: true },
    });
    if (!opportunity) {
      throw new Error("Oportunidade inválida para esta empresa");
    }
  }
}

export async function listActivitiesForTenant(params: {
  companyId: string;
  role: Role;
  query: ActivityListQuery;
}) {
  assertPermission(params.role, "crm:activities:view");
  return findActivities({ companyId: params.companyId, ...params.query });
}

export async function getActivityForTenant(params: {
  companyId: string;
  role: Role;
  activityId: string;
}) {
  assertPermission(params.role, "crm:activities:view");
  return findActivityById({
    companyId: params.companyId,
    activityId: params.activityId,
  });
}

export async function createActivityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: ActivityFormInput;
}) {
  assertPermission(params.role, "crm:activities:manage");
  await assertActivityRelations(params.companyId, params.data);
  const activity = await createActivity({
    companyId: params.companyId,
    data: params.data,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "ACTIVITY_CREATE",
    entity: "Activity",
    entityId: activity.id,
    metadata: {
      title: activity.title,
      type: activity.type,
      status: activity.status,
    },
  });
  await notifyTaskAssigned({
    companyId: params.companyId,
    actorUserId: params.userId,
    activityId: activity.id,
    ownerId: activity.ownerId,
    title: activity.title,
  }).catch(() => undefined);
  return activity;
}

export async function updateActivityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  activityId: string;
  data: ActivityFormInput;
}) {
  assertPermission(params.role, "crm:activities:manage");
  await assertActivityRelations(params.companyId, params.data);
  const activity = await updateActivity({
    companyId: params.companyId,
    activityId: params.activityId,
    data: params.data,
  });
  if (!activity) throw new Error("Atividade não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "ACTIVITY_UPDATE",
    entity: "Activity",
    entityId: activity.id,
    metadata: { title: activity.title, status: activity.status },
  });
  await notifyTaskAssigned({
    companyId: params.companyId,
    actorUserId: params.userId,
    activityId: activity.id,
    ownerId: activity.ownerId,
    title: activity.title,
  }).catch(() => undefined);
  return activity;
}

export async function changeActivityStatusForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  activityId: string;
  status: ActivityStatus;
}) {
  assertPermission(params.role, "crm:activities:manage");
  const activity = await setActivityStatus(params);
  if (!activity) throw new Error("Atividade não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action:
      params.status === "COMPLETED"
        ? "ACTIVITY_COMPLETE"
        : params.status === "CANCELLED"
          ? "ACTIVITY_CANCEL"
          : "ACTIVITY_STATUS_CHANGE",
    entity: "Activity",
    entityId: activity.id,
    metadata: { title: activity.title, status: activity.status },
  });
  return activity;
}

export async function deleteActivityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  activityId: string;
}) {
  assertPermission(params.role, "crm:activities:manage");
  const activity = await softDeleteActivity(params);
  if (!activity) throw new Error("Atividade não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "ACTIVITY_DELETE",
    entity: "Activity",
    entityId: activity.id,
    metadata: { title: activity.title },
  });
  return activity;
}

export async function getEntityActivities(params: {
  companyId: string;
  role: Role;
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
}) {
  assertPermission(params.role, "crm:activities:view");
  return listRelatedActivities(params);
}

export async function getActivityFormMeta(companyId: string) {
  const [owners, customers, leads, opportunities] = await Promise.all([
    listCompanyOwners(companyId),
    listTenantCustomers(companyId),
    listTenantLeads(companyId),
    prisma.opportunity.findMany({
      where: { companyId, ...notDeletedFilter },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);
  return {
    owners: owners.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
    customers,
    leads,
    opportunities,
  };
}
