import type { OpportunityStage, Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { opportunityStageSchema } from "@/modules/crm/schemas/opportunity.schemas";

export const PIPELINE_STAGES: OpportunityStage[] = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export function canViewPipeline(role: Role): boolean {
  return hasPermission(role, "crm:pipeline:view");
}

export function canManagePipeline(role: Role): boolean {
  return hasPermission(role, "crm:pipeline:manage");
}

export async function getPipelineBoard(params: {
  companyId: string;
  role: Role;
}) {
  assertPermission(params.role, "crm:pipeline:view");

  const items = await prisma.opportunity.findMany({
    where: {
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    orderBy: [{ expectedCloseDate: "asc" }, { updatedAt: "desc" }],
    include: {
      owner: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  const columns = PIPELINE_STAGES.map((stage) => {
    const stageItems = items.filter((item) => item.stage === stage);
    const totalValue = stageItems.reduce((sum, item) => {
      return sum + (item.estimatedValue ? Number(item.estimatedValue) : 0);
    }, 0);
    return {
      stage,
      items: stageItems,
      count: stageItems.length,
      totalValue,
    };
  });

  return { columns, total: items.length };
}

export async function moveOpportunityStage(params: {
  companyId: string;
  userId: string;
  role: Role;
  opportunityId: string;
  stage: string;
}) {
  assertPermission(params.role, "crm:pipeline:manage");

  const parsedStage = opportunityStageSchema.safeParse(params.stage);
  if (!parsedStage.success) {
    throw new Error("Estágio inválido");
  }

  const existing = await prisma.opportunity.findFirst({
    where: {
      id: params.opportunityId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
  });
  if (!existing) {
    throw new Error("Oportunidade não encontrada");
  }

  if (existing.stage === parsedStage.data) {
    return existing;
  }

  const updated = await prisma.opportunity.update({
    where: { id: existing.id },
    data: { stage: parsedStage.data },
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "crm",
    action: "OPPORTUNITY_STAGE_MOVE",
    entity: "Opportunity",
    entityId: updated.id,
    metadata: {
      name: updated.name,
      from: existing.stage,
      to: updated.stage,
    },
  });

  return updated;
}
