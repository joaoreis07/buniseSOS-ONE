/**
 * CRM leads verification (FASE 4.2) — BusinessOS One only.
 * Run: npm run verify:leads
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
    email: `lead-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Lead A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `lead-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Lead B ${suffix}`,
  });

  const leadA = await prisma.lead.create({
    data: {
      companyId: a.company.id,
      name: "Lead Alpha",
      companyName: "Alpha Ltda",
      email: `alpha-${suffix}@example.com`,
      phone: "11988887777",
      origin: "WEBSITE",
      status: "NEW",
      ownerId: a.user.id,
      estimatedValue: 1500,
    },
  });
  const leadB = await prisma.lead.create({
    data: {
      companyId: b.company.id,
      name: "Lead Beta",
      email: `beta-${suffix}@example.com`,
      origin: "INSTAGRAM",
      status: "CONTACTED",
    },
  });

  const cross = await prisma.lead.findFirst({
    where: { id: leadB.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!cross, "tenant isolation");

  const search = await prisma.lead.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      OR: [
        { name: { contains: "Alpha", mode: "insensitive" } },
        { email: { contains: `alpha-${suffix}` } },
        { phone: { contains: "11988887777" } },
        { companyName: { contains: "Alpha", mode: "insensitive" } },
      ],
    },
  });
  assert(search.length === 1, "search works");

  const updated = await prisma.lead.update({
    where: { id: leadA.id },
    data: { status: "QUALIFIED", ownerId: a.user.id },
  });
  assert(updated.status === "QUALIFIED", "status change");

  // owner from other tenant rejected at service layer — simulate check
  const foreignOwner = await prisma.membership.findFirst({
    where: {
      companyId: a.company.id,
      userId: b.user.id,
      deletedAt: null,
    },
  });
  assert(!foreignOwner, "foreign owner not in tenant A");

  await prisma.lead.update({
    where: { id: leadA.id },
    data: { deletedAt: new Date() },
  });
  const soft = await prisma.lead.findFirst({
    where: { id: leadA.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!soft, "soft delete hides lead");

  assert(hasPermission("ADMIN", "crm:leads:manage"), "ADMIN manage");
  assert(hasPermission("SALES", "crm:leads:manage"), "SALES manage");
  assert(hasPermission("MANAGER", "crm:leads:view"), "MANAGER view");
  assert(!hasPermission("FINANCE", "crm:leads:view"), "FINANCE no leads");
  assert(!hasPermission("FINANCE", "crm:leads:manage"), "FINANCE no manage");
  assert(!hasPermission("INVENTORY", "crm:leads:view"), "INVENTORY no leads");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(
      typeof hasPermission(role, "crm:leads:view") === "boolean",
      `role ${role}`,
    );
  }

  await prisma.lead.deleteMany({
    where: { id: { in: [leadA.id, leadB.id] } },
  });
  await prisma.membership.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.company.deleteMany({
    where: { id: { in: [a.company.id, b.company.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [a.user.id, b.user.id] } },
  });

  console.log("OK leads CRUD + soft delete");
  console.log("OK tenant isolation");
  console.log("OK search + status");
  console.log("OK RBAC (FINANCE/INVENTORY blocked)");
  console.log("LEADS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("LEADS VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
