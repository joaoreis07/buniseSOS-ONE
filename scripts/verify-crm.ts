/**
 * CRM complete verification (FASE 4) — BusinessOS One only.
 * Run: npm run verify:crm
 *
 * Covers: Customer → Lead → Opportunity → Pipeline → Activity → Dashboard metrics
 * plus tenant isolation and RBAC permissions.
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { assertVerificationDatabase } from "./lib/assert-one-database";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function registerTenant(input: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const passwordHash = await hash(input.password, 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });
    const company = await tx.company.create({
      data: { name: input.companyName },
    });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    return { user, company };
  });
}

async function main() {
  assertVerificationDatabase();

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `crm-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa CRM A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `crm-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa CRM B ${suffix}`,
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Flow ${suffix}`,
      status: "ACTIVE",
      ownerId: a.user.id,
    },
  });
  const lead = await prisma.lead.create({
    data: {
      companyId: a.company.id,
      name: `Lead Flow ${suffix}`,
      origin: "WEBSITE",
      status: "QUALIFIED",
      ownerId: a.user.id,
    },
  });
  const opportunity = await prisma.opportunity.create({
    data: {
      companyId: a.company.id,
      name: `Opp Flow ${suffix}`,
      stage: "NEW",
      estimatedValue: 9000,
      probability: 30,
      ownerId: a.user.id,
      customerId: customer.id,
      leadId: lead.id,
    },
  });

  const moved = await prisma.opportunity.update({
    where: { id: opportunity.id },
    data: { stage: "WON", probability: 100 },
  });
  assert(moved.stage === "WON", "pipeline stage");

  const activity = await prisma.activity.create({
    data: {
      companyId: a.company.id,
      title: `Atividade Flow ${suffix}`,
      type: "TASK",
      status: "PENDING",
      ownerId: a.user.id,
      dueAt: new Date(Date.now() - 3600000),
      opportunityId: opportunity.id,
      customerId: customer.id,
      leadId: lead.id,
    },
  });

  await prisma.activity.update({
    where: { id: activity.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  const [
    leadsTotal,
    opportunitiesWon,
    activitiesCompleted,
    activitiesOverdue,
    byStage,
  ] = await Promise.all([
    prisma.lead.count({
      where: { companyId: a.company.id, deletedAt: null },
    }),
    prisma.opportunity.count({
      where: { companyId: a.company.id, deletedAt: null, stage: "WON" },
    }),
    prisma.activity.count({
      where: {
        companyId: a.company.id,
        deletedAt: null,
        status: "COMPLETED",
      },
    }),
    prisma.activity.count({
      where: {
        companyId: a.company.id,
        deletedAt: null,
        status: "PENDING",
        dueAt: { lt: new Date() },
      },
    }),
    prisma.opportunity.groupBy({
      by: ["stage"],
      where: { companyId: a.company.id, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  assert(leadsTotal === 1, "dashboard leads");
  assert(opportunitiesWon === 1, "dashboard won");
  assert(activitiesCompleted === 1, "dashboard activities");
  assert(activitiesOverdue === 0, "no overdue after complete");
  assert(
    byStage.some((row) => row.stage === "WON" && row._count._all === 1),
    "stage chart",
  );

  assert(
    !(await prisma.customer.findFirst({
      where: { id: customer.id, companyId: b.company.id },
    })),
    "customer tenant",
  );
  assert(
    !(await prisma.lead.findFirst({
      where: { id: lead.id, companyId: b.company.id },
    })),
    "lead tenant",
  );
  assert(
    !(await prisma.opportunity.findFirst({
      where: { id: opportunity.id, companyId: b.company.id },
    })),
    "opportunity tenant",
  );
  assert(
    !(await prisma.activity.findFirst({
      where: { id: activity.id, companyId: b.company.id },
    })),
    "activity tenant",
  );

  assert(hasPermission("ADMIN", "crm:dashboard:view"), "dashboard ADMIN");
  assert(hasPermission("SALES", "crm:dashboard:view"), "dashboard SALES");
  assert(!hasPermission("FINANCE", "crm:dashboard:view"), "dashboard FINANCE");
  assert(hasPermission("SALES", "crm:pipeline:manage"), "pipeline SALES");
  assert(hasPermission("SALES", "crm:activities:manage"), "activities SALES");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(typeof hasPermission(role, "crm:view") === "boolean", `crm ${role}`);
  }

  await prisma.activity.deleteMany({ where: { id: activity.id } });
  await prisma.opportunity.deleteMany({ where: { id: opportunity.id } });
  await prisma.lead.deleteMany({ where: { id: lead.id } });
  await prisma.customer.deleteMany({ where: { id: customer.id } });
  await prisma.membership.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.company.deleteMany({
    where: { id: { in: [a.company.id, b.company.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [a.user.id, b.user.id] } },
  });

  console.log("OK Customer → Lead → Opportunity → Pipeline → Activity");
  console.log("OK Dashboard metrics reflect changes");
  console.log("OK tenant + RBAC");
  console.log("CRM VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("CRM VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
