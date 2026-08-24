/**
 * CRM customers verification (FASE 4.1) — BusinessOS One only.
 * Run: npx tsx scripts/verify-customers.ts
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
  const password = "TestPass123!";

  const a = await registerTenant({
    name: "Admin A",
    email: `crm-a-${suffix}@example.com`,
    password,
    companyName: `Empresa CRM A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `crm-b-${suffix}@example.com`,
    password,
    companyName: `Empresa CRM B ${suffix}`,
  });

  const customerA = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: "Cliente Alpha",
      email: `alpha-${suffix}@example.com`,
      document: "12345678901",
      phone: "11999990000",
      status: "ACTIVE",
      origin: "Indicação",
      ownerId: a.user.id,
    },
  });
  const customerB = await prisma.customer.create({
    data: {
      companyId: b.company.id,
      name: "Cliente Beta",
      email: `beta-${suffix}@example.com`,
      document: "12345678000199",
      status: "ACTIVE",
      origin: "Site",
    },
  });

  const aSeesB = await prisma.customer.findFirst({
    where: {
      id: customerB.id,
      companyId: a.company.id,
      deletedAt: null,
    },
  });
  assert(!aSeesB, "tenant A must not see customer B");

  const listedA = await prisma.customer.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      OR: [
        { name: { contains: "Alpha", mode: "insensitive" } },
        { document: { contains: "12345678901" } },
        { email: { contains: `alpha-${suffix}` } },
        { phone: { contains: "11999990000" } },
      ],
    },
  });
  assert(listedA.length === 1, "search should find customer A");

  const updated = await prisma.customer.update({
    where: { id: customerA.id },
    data: { city: "São Paulo", status: "INACTIVE" },
  });
  assert(updated.city === "São Paulo", "update city");
  assert(updated.status === "INACTIVE", "update status");

  await prisma.customer.update({
    where: { id: customerA.id },
    data: { deletedAt: new Date() },
  });
  const softDeleted = await prisma.customer.findFirst({
    where: { id: customerA.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!softDeleted, "soft deleted customer hidden");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  assert(hasPermission("ADMIN", "crm:manage"), "ADMIN manage");
  assert(hasPermission("SALES", "crm:manage"), "SALES manage");
  assert(hasPermission("FINANCE", "crm:view"), "FINANCE view");
  assert(!hasPermission("FINANCE", "crm:manage"), "FINANCE no manage");
  assert(!hasPermission("INVENTORY", "crm:view"), "INVENTORY no crm");
  for (const role of roles) {
    assert(typeof hasPermission(role, "crm:view") === "boolean", `role ${role}`);
  }

  // cleanup
  await prisma.customer.deleteMany({
    where: { id: { in: [customerA.id, customerB.id] } },
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

  console.log("OK customers CRUD + soft delete");
  console.log("OK tenant isolation");
  console.log("OK search fields");
  console.log("OK RBAC matrix for CRM");
  console.log("CUSTOMERS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("CUSTOMERS VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
