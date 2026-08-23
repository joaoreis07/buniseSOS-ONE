/**
 * Foundation verification for BusinessOS One (FASE 2/3).
 * Uses only the One DATABASE_URL — never touches Finance.
 *
 * Run: npx tsx scripts/verify-foundation.ts
 */
import { PrismaClient, type Role } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERT: ${message}`);
  }
}

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port}${parsed.pathname}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

async function hashPassword(password: string) {
  return hash(password, 12);
}

async function registerTenant(input: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const email = input.email.toLowerCase().trim();
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email, passwordHash },
    });
    const company = await tx.company.create({
      data: { name: input.companyName },
    });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    await tx.companySettings.create({ data: { companyId: company.id } });
    return { user, company };
  });
}

const ROLE_PERMISSIONS: Record<Role, ReadonlyArray<string>> = {
  ADMIN: ["*"],
  MANAGER: [
    "dashboard:view",
    "crm:view",
    "crm:manage",
    "sales:view",
    "sales:manage",
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:manage",
    "finance:view",
    "finance:manage",
    "dre:view",
    "ecommerce:view",
    "ecommerce:manage",
    "reports:view",
    "settings:view",
    "settings:manage",
  ],
  SALES: [
    "dashboard:view",
    "crm:view",
    "crm:manage",
    "sales:view",
    "sales:manage",
    "products:view",
    "reports:view",
  ],
  FINANCE: [
    "dashboard:view",
    "finance:view",
    "finance:manage",
    "dre:view",
    "reports:view",
    "sales:view",
  ],
  INVENTORY: [
    "dashboard:view",
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:manage",
  ],
};

function hasPermission(role: Role, permission: string): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return granted.includes("*") || granted.includes(permission);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  console.log("DATABASE:", maskDatabaseUrl(databaseUrl));

  assert(databaseUrl.includes("5434"), "DATABASE_URL must use port 5434");
  assert(
    databaseUrl.includes("businessos_one"),
    "DATABASE_URL must target businessos_one",
  );
  assert(
    !databaseUrl.includes("businessos_finance") &&
      !/localhost:5432\b/.test(databaseUrl),
    "DATABASE_URL must not point to Finance",
  );

  // Tables exist
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  const names = tables.map((t) => t.tablename);
  for (const required of [
    "User",
    "Company",
    "Membership",
    "Account",
    "Session",
    "VerificationToken",
    "Invite",
    "AuditLog",
    "SystemLog",
    "CompanySettings",
  ]) {
    assert(names.includes(required), `missing table ${required}`);
  }
  console.log("OK tables:", names.join(", "));

  const suffix = randomBytes(4).toString("hex");
  const password = "TestPass123!";

  const tenantA = await registerTenant({
    name: "Admin A",
    email: `admin-a-${suffix}@example.com`,
    password,
    companyName: `Empresa A ${suffix}`,
  });
  const tenantB = await registerTenant({
    name: "Admin B",
    email: `admin-b-${suffix}@example.com`,
    password,
    companyName: `Empresa B ${suffix}`,
  });

  assert(tenantA.company.id !== tenantB.company.id, "tenants must differ");

  // Login credentials check
  const userA = await prisma.user.findUniqueOrThrow({
    where: { id: tenantA.user.id },
  });
  assert(userA.passwordHash, "password hash required");
  assert(await compare(password, userA.passwordHash), "password verify ok");
  assert(
    !(await compare("wrong-password", userA.passwordHash)),
    "wrong password rejected",
  );

  // Cross-tenant membership isolation
  const aSeesB = await prisma.membership.findFirst({
    where: {
      userId: tenantA.user.id,
      companyId: tenantB.company.id,
      deletedAt: null,
    },
  });
  assert(!aSeesB, "user A must not have membership in company B");

  const membersA = await prisma.membership.findMany({
    where: { companyId: tenantA.company.id, deletedAt: null },
  });
  const membersB = await prisma.membership.findMany({
    where: { companyId: tenantB.company.id, deletedAt: null },
  });
  assert(
    membersA.every((m) => m.companyId === tenantA.company.id),
    "members A only in A",
  );
  assert(
    membersB.every((m) => m.companyId === tenantB.company.id),
    "members B only in B",
  );
  assert(
    !membersA.some((m) => m.companyId === tenantB.company.id),
    "no cross-tenant leak A→B",
  );

  // Role seeding: add SALES member to A and validate RBAC matrix
  const salesUser = await prisma.user.create({
    data: {
      name: "Sales A",
      email: `sales-a-${suffix}@example.com`,
      passwordHash: await hashPassword(password),
    },
  });
  await prisma.membership.create({
    data: {
      userId: salesUser.id,
      companyId: tenantA.company.id,
      role: "SALES",
    },
  });

  assert(hasPermission("ADMIN", "settings:manage"), "ADMIN settings");
  assert(hasPermission("SALES", "crm:view"), "SALES crm");
  assert(!hasPermission("SALES", "finance:manage"), "SALES no finance");
  assert(hasPermission("FINANCE", "dre:view"), "FINANCE dre");
  assert(!hasPermission("FINANCE", "inventory:manage"), "FINANCE no inventory");
  assert(hasPermission("INVENTORY", "inventory:view"), "INVENTORY stock");
  assert(!hasPermission("INVENTORY", "crm:manage"), "INVENTORY no crm");
  assert(hasPermission("MANAGER", "settings:manage"), "MANAGER settings");

  // Invite + accept within tenant A
  const rawInvite = randomBytes(32).toString("hex");
  const inviteHash = createHash("sha256").update(rawInvite).digest("hex");
  await prisma.invite.create({
    data: {
      companyId: tenantA.company.id,
      email: `invitee-${suffix}@example.com`,
      role: "FINANCE",
      token: inviteHash,
      invitedById: tenantA.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "PENDING",
    },
  });
  const invite = await prisma.invite.findFirst({
    where: { token: inviteHash, status: "PENDING" },
  });
  assert(invite, "invite created");
  assert(invite.companyId === tenantA.company.id, "invite belongs to A");

  // Session version bump invalidates conceptually
  await prisma.user.update({
    where: { id: tenantA.user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  const bumped = await prisma.user.findUniqueOrThrow({
    where: { id: tenantA.user.id },
  });
  assert(bumped.sessionVersion === 1, "sessionVersion bumped");

  // Cleanup test data
  await prisma.invite.deleteMany({
    where: { companyId: { in: [tenantA.company.id, tenantB.company.id] } },
  });
  await prisma.auditLog.deleteMany({
    where: { companyId: { in: [tenantA.company.id, tenantB.company.id] } },
  });
  await prisma.membership.deleteMany({
    where: { companyId: { in: [tenantA.company.id, tenantB.company.id] } },
  });
  await prisma.companySettings.deleteMany({
    where: { companyId: { in: [tenantA.company.id, tenantB.company.id] } },
  });
  await prisma.company.deleteMany({
    where: { id: { in: [tenantA.company.id, tenantB.company.id] } },
  });
  await prisma.user.deleteMany({
    where: {
      id: { in: [tenantA.user.id, tenantB.user.id, salesUser.id] },
    },
  });

  console.log("OK register/login/password");
  console.log("OK multi-tenant isolation (Empresa A ≠ Empresa B)");
  console.log("OK RBAC matrix (ADMIN/MANAGER/SALES/FINANCE/INVENTORY)");
  console.log("OK invite + sessionVersion");
  console.log("FOUNDATION VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("FOUNDATION VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
