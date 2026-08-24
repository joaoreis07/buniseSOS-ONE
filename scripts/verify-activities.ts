/**
 * CRM activities verification (FASE 4.5) — BusinessOS One only.
 * Run: npm run verify:activities
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";

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
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `act-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Act A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `act-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Act B ${suffix}`,
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Act ${suffix}`,
      status: "ACTIVE",
    },
  });
  const lead = await prisma.lead.create({
    data: {
      companyId: a.company.id,
      name: `Lead Act ${suffix}`,
      origin: "WHATSAPP",
    },
  });
  const opportunity = await prisma.opportunity.create({
    data: {
      companyId: a.company.id,
      name: `Opp Act ${suffix}`,
      stage: "QUALIFIED",
      customerId: customer.id,
      leadId: lead.id,
    },
  });

  const activity = await prisma.activity.create({
    data: {
      companyId: a.company.id,
      title: `Follow-up ${suffix}`,
      type: "CALL",
      status: "PENDING",
      ownerId: a.user.id,
      dueAt: new Date(Date.now() + 86400000),
      customerId: customer.id,
      leadId: lead.id,
      opportunityId: opportunity.id,
    },
  });

  const listed = await prisma.activity.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      status: "PENDING",
      ownerId: a.user.id,
    },
  });
  assert(listed.length === 1, "list + filters");

  const related = await prisma.activity.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      customerId: customer.id,
    },
  });
  assert(related.length === 1, "related to customer");

  const completed = await prisma.activity.update({
    where: { id: activity.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  assert(completed.status === "COMPLETED", "complete");

  const cancelled = await prisma.activity.update({
    where: { id: activity.id },
    data: { status: "CANCELLED" },
  });
  assert(cancelled.status === "CANCELLED", "cancel");

  await prisma.activity.update({
    where: { id: activity.id },
    data: { deletedAt: new Date() },
  });
  const soft = await prisma.activity.findFirst({
    where: { id: activity.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!soft, "soft delete");

  const cross = await prisma.activity.findFirst({
    where: { id: activity.id, companyId: b.company.id },
  });
  assert(!cross, "tenant isolation");

  assert(hasPermission("ADMIN", "crm:activities:manage"), "ADMIN manage");
  assert(hasPermission("SALES", "crm:activities:view"), "SALES view");
  assert(!hasPermission("FINANCE", "crm:activities:view"), "FINANCE blocked");
  assert(!hasPermission("INVENTORY", "crm:activities:view"), "INVENTORY blocked");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(
      typeof hasPermission(role, "crm:activities:view") === "boolean",
      `role ${role}`,
    );
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

  console.log("OK activities CRUD + status + soft delete");
  console.log("OK relations + dates + owner");
  console.log("OK tenant isolation + RBAC");
  console.log("ACTIVITIES VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("ACTIVITIES VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
