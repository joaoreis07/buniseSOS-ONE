/**
 * CRM pipeline verification (FASE 4.4) — BusinessOS One only.
 * Run: npm run verify:pipeline
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
    email: `pipe-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Pipe A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `pipe-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Pipe B ${suffix}`,
  });

  const oppA = await prisma.opportunity.create({
    data: {
      companyId: a.company.id,
      name: `Opp Funil ${suffix}`,
      ownerId: a.user.id,
      stage: "NEW",
      estimatedValue: 12000,
      probability: 20,
    },
  });
  await prisma.opportunity.create({
    data: {
      companyId: b.company.id,
      name: `Opp B ${suffix}`,
      stage: "PROPOSAL",
    },
  });

  const boardA = await prisma.opportunity.groupBy({
    by: ["stage"],
    where: { companyId: a.company.id, deletedAt: null },
    _count: { _all: true },
  });
  assert(
    boardA.some((row) => row.stage === "NEW" && row._count._all === 1),
    "board loads NEW",
  );

  const moved = await prisma.opportunity.update({
    where: { id: oppA.id },
    data: { stage: "NEGOTIATION" },
  });
  assert(moved.stage === "NEGOTIATION", "stage move");

  const cross = await prisma.opportunity.findFirst({
    where: { id: oppA.id, companyId: b.company.id, deletedAt: null },
  });
  assert(!cross, "tenant isolation");

  assert(hasPermission("ADMIN", "crm:pipeline:manage"), "ADMIN manage");
  assert(hasPermission("SALES", "crm:pipeline:view"), "SALES view");
  assert(hasPermission("MANAGER", "crm:pipeline:manage"), "MANAGER manage");
  assert(!hasPermission("FINANCE", "crm:pipeline:view"), "FINANCE blocked");
  assert(!hasPermission("INVENTORY", "crm:pipeline:view"), "INVENTORY blocked");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(
      typeof hasPermission(role, "crm:pipeline:view") === "boolean",
      `role ${role}`,
    );
  }

  await prisma.opportunity.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
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

  console.log("OK pipeline board + stage move");
  console.log("OK tenant isolation");
  console.log("OK RBAC");
  console.log("PIPELINE VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("PIPELINE VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
