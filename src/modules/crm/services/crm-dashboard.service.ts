import type { Role } from "@prisma/client";
import { assertPermission } from "@/shared/permissions/rbac";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { PIPELINE_STAGES } from "@/modules/crm/services/pipeline.service";

export async function getCrmDashboard(params: {
  companyId: string;
  role: Role;
}) {
  assertPermission(params.role, "crm:dashboard:view");
  const companyId = params.companyId;
  const now = new Date();

  const [
    leadsTotal,
    leadsNew,
    leadsConverted,
    leadsLost,
    opportunitiesTotal,
    opportunitiesOpen,
    opportunitiesWon,
    opportunitiesLost,
    openOpps,
    activitiesPending,
    activitiesCompleted,
    activitiesOverdue,
    allOpenAndClosed,
    owners,
  ] = await Promise.all([
    prisma.lead.count({ where: { companyId, ...notDeletedFilter } }),
    prisma.lead.count({
      where: { companyId, ...notDeletedFilter, status: "NEW" },
    }),
    prisma.lead.count({
      where: { companyId, ...notDeletedFilter, status: "CONVERTED" },
    }),
    prisma.lead.count({
      where: { companyId, ...notDeletedFilter, status: "LOST" },
    }),
    prisma.opportunity.count({ where: { companyId, ...notDeletedFilter } }),
    prisma.opportunity.count({
      where: {
        companyId,
        ...notDeletedFilter,
        stage: { in: ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION"] },
      },
    }),
    prisma.opportunity.count({
      where: { companyId, ...notDeletedFilter, stage: "WON" },
    }),
    prisma.opportunity.count({
      where: { companyId, ...notDeletedFilter, stage: "LOST" },
    }),
    prisma.opportunity.findMany({
      where: {
        companyId,
        ...notDeletedFilter,
        stage: { in: ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION"] },
      },
      select: {
        stage: true,
        estimatedValue: true,
        ownerId: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.activity.count({
      where: { companyId, ...notDeletedFilter, status: "PENDING" },
    }),
    prisma.activity.count({
      where: { companyId, ...notDeletedFilter, status: "COMPLETED" },
    }),
    prisma.activity.count({
      where: {
        companyId,
        ...notDeletedFilter,
        status: "PENDING",
        dueAt: { lt: now },
      },
    }),
    prisma.opportunity.groupBy({
      by: ["stage"],
      where: { companyId, ...notDeletedFilter },
      _count: { _all: true },
      _sum: { estimatedValue: true },
    }),
    prisma.membership.findMany({
      where: { companyId, ...notDeletedFilter },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const pipelineValue = openOpps.reduce(
    (sum, item) => sum + (item.estimatedValue ? Number(item.estimatedValue) : 0),
    0,
  );

  const opportunitiesByStage = PIPELINE_STAGES.map((stage) => {
    const row = allOpenAndClosed.find((item) => item.stage === stage);
    return {
      stage,
      count: row?._count._all ?? 0,
      value: row?._sum.estimatedValue ? Number(row._sum.estimatedValue) : 0,
    };
  });

  const byOwner = owners.map((membership) => {
    const owned = openOpps.filter((item) => item.ownerId === membership.userId);
    return {
      ownerId: membership.user.id,
      name: membership.user.name ?? membership.user.email,
      count: owned.length,
      value: owned.reduce(
        (sum, item) =>
          sum + (item.estimatedValue ? Number(item.estimatedValue) : 0),
        0,
      ),
    };
  });

  const leadToOpportunityRate =
    leadsTotal > 0 ? Math.round((opportunitiesTotal / leadsTotal) * 100) : 0;
  const opportunityWinRate =
    opportunitiesTotal > 0
      ? Math.round((opportunitiesWon / opportunitiesTotal) * 100)
      : 0;

  return {
    leads: {
      total: leadsTotal,
      new: leadsNew,
      converted: leadsConverted,
      lost: leadsLost,
    },
    opportunities: {
      total: opportunitiesTotal,
      open: opportunitiesOpen,
      won: opportunitiesWon,
      lost: opportunitiesLost,
      pipelineValue,
    },
    conversion: {
      leadToOpportunityRate,
      opportunityWinRate,
    },
    activities: {
      pending: activitiesPending,
      completed: activitiesCompleted,
      overdue: activitiesOverdue,
    },
    opportunitiesByStage,
    byOwner,
  };
}
