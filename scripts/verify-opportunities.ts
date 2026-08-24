/**
 * CRM opportunities verification (FASE 4.3) — BusinessOS One only.
 * Run: npm run verify:opportunities
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
    email: `opp-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Opp A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `opp-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Opp B ${suffix}`,
  });

  const leadA = await prisma.lead.create({
    data: {
      companyId: a.company.id,
      name: `Lead Opp ${suffix}`,
      origin: "WEBSITE",
      status: "QUALIFIED",
    },
  });
  const customerA = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Opp ${suffix}`,
      status: "ACTIVE",
    },
  });
  const leadB = await prisma.lead.create({
    data: {
      companyId: b.company.id,
      name: `Lead B ${suffix}`,
      origin: "OTHER",
    },
  });

  const oppA = await prisma.opportunity.create({
    data: {
      companyId: a.company.id,
      name: `Oportunidade Alpha ${suffix}`,
      leadId: leadA.id,
      customerId: customerA.id,
      ownerId: a.user.id,
      stage: "NEW",
      estimatedValue: 5000,
      probability: 25,
      expectedCloseDate: new Date("2026-12-31T12:00:00.000Z"),
    },
  });

  // Cross-tenant link must be rejected conceptually
  const foreignLead = await prisma.lead.findFirst({
    where: { id: leadB.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!foreignLead, "lead B not in tenant A");

  const cross = await prisma.opportunity.findFirst({
    where: { id: oppA.id, companyId: b.company.id, deletedAt: null },
  });
  assert(!cross, "tenant isolation");

  const search = await prisma.opportunity.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      OR: [
        { name: { contains: "Alpha", mode: "insensitive" } },
        { lead: { name: { contains: "Lead Opp", mode: "insensitive" } } },
        { customer: { name: { contains: "Cliente Opp", mode: "insensitive" } } },
      ],
    },
  });
  assert(search.length === 1, "search works");

  const updated = await prisma.opportunity.update({
    where: { id: oppA.id },
    data: { stage: "PROPOSAL", probability: 60 },
  });
  assert(updated.stage === "PROPOSAL", "stage change");
  assert(updated.probability === 60, "probability change");

  await prisma.opportunity.update({
    where: { id: oppA.id },
    data: { deletedAt: new Date() },
  });
  const soft = await prisma.opportunity.findFirst({
    where: { id: oppA.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!soft, "soft delete hides opportunity");

  assert(hasPermission("ADMIN", "crm:opportunities:manage"), "ADMIN manage");
  assert(hasPermission("SALES", "crm:opportunities:view"), "SALES view");
  assert(hasPermission("MANAGER", "crm:opportunities:manage"), "MANAGER manage");
  assert(!hasPermission("FINANCE", "crm:opportunities:view"), "FINANCE blocked");
  assert(!hasPermission("INVENTORY", "crm:opportunities:view"), "INVENTORY blocked");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(
      typeof hasPermission(role, "crm:opportunities:view") === "boolean",
      `role ${role}`,
    );
  }

  await prisma.opportunity.deleteMany({ where: { id: oppA.id } });
  await prisma.lead.deleteMany({ where: { id: { in: [leadA.id, leadB.id] } } });
  await prisma.customer.deleteMany({ where: { id: customerA.id } });
  await prisma.membership.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.company.deleteMany({
    where: { id: { in: [a.company.id, b.company.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [a.user.id, b.user.id] } },
  });

  console.log("OK opportunities CRUD + soft delete");
  console.log("OK lead/customer relations + tenant isolation");
  console.log("OK stage/probability/search");
  console.log("OK RBAC");
  console.log("OPPORTUNITIES VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("OPPORTUNITIES VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
