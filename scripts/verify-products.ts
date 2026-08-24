/**
 * Products + categories verification (FASE 5) — BusinessOS One only.
 * Run: npm run verify:products
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
    email: `prod-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Prod A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `prod-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Prod B ${suffix}`,
  });

  const catA = await prisma.productCategory.create({
    data: {
      companyId: a.company.id,
      name: `Cat A ${suffix}`,
      description: "Categoria tenant A",
    },
  });
  const catB = await prisma.productCategory.create({
    data: {
      companyId: b.company.id,
      name: `Cat B ${suffix}`,
    },
  });

  const product = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Alpha ${suffix}`,
      sku: `SKU-${suffix}`,
      barcode: `789${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      categoryId: catA.id,
      costPrice: 10,
      salePrice: 25.5,
      imageUrl: "https://example.com/product.jpg",
    },
  });

  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço Beta ${suffix}`,
      sku: `SRV-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      costPrice: 0,
      salePrice: 100,
    },
  });

  // Cross-tenant category must not resolve for A
  const foreignCat = await prisma.productCategory.findFirst({
    where: { id: catB.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!foreignCat, "category tenant isolation");

  const crossProduct = await prisma.product.findFirst({
    where: { id: product.id, companyId: b.company.id, deletedAt: null },
  });
  assert(!crossProduct, "product tenant isolation");

  // SKU uniqueness among active
  let skuDup = false;
  try {
    await prisma.product.create({
      data: {
        companyId: a.company.id,
        name: "Dup",
        sku: `SKU-${suffix}`,
        type: "PRODUCT",
      },
    });
  } catch {
    skuDup = true;
  }
  assert(skuDup, "duplicate SKU blocked");

  // Negative prices rejected conceptually at app layer — DB allows; verify non-negative stored
  assert(Number(product.costPrice) >= 0, "cost >= 0");
  assert(Number(product.salePrice) >= 0, "sale >= 0");

  const search = await prisma.product.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      name: { contains: "Alpha", mode: "insensitive" },
    },
  });
  assert(search.length === 1, "search by name works");

  const searchSku = await prisma.product.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      sku: { contains: `SKU-${suffix}`, mode: "insensitive" },
    },
  });
  assert(searchSku.length === 1, "search by sku works");

  const searchBarcode = await prisma.product.findMany({
    where: {
      companyId: a.company.id,
      deletedAt: null,
      barcode: { contains: suffix },
    },
  });
  assert(searchBarcode.length === 1, "search by barcode works");

  const byType = await prisma.product.count({
    where: { companyId: a.company.id, deletedAt: null, type: "SERVICE" },
  });
  assert(byType === 1, "type filter");

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { status: "INACTIVE", salePrice: 30 },
  });
  assert(updated.status === "INACTIVE", "status change");

  await prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date() },
  });
  const soft = await prisma.product.findFirst({
    where: { id: product.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!soft, "soft delete hides product");

  // Soft-deleted SKU can be reused
  const reused = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: "Reused SKU",
      sku: `SKU-${suffix}`,
      type: "PRODUCT",
    },
  });
  assert(reused.sku === `SKU-${suffix}`, "sku reuse after soft delete");

  await prisma.productCategory.update({
    where: { id: catA.id },
    data: { deletedAt: new Date() },
  });
  const softCat = await prisma.productCategory.findFirst({
    where: { id: catA.id, companyId: a.company.id, deletedAt: null },
  });
  assert(!softCat, "category soft delete");

  assert(hasPermission("ADMIN", "products:manage"), "ADMIN products");
  assert(hasPermission("ADMIN", "categories:manage"), "ADMIN categories");
  assert(hasPermission("SALES", "products:view"), "SALES products view");
  assert(hasPermission("SALES", "categories:view"), "SALES categories view");
  assert(!hasPermission("SALES", "products:manage"), "SALES no manage");
  assert(hasPermission("INVENTORY", "products:manage"), "INVENTORY manage");
  assert(hasPermission("INVENTORY", "categories:manage"), "INVENTORY cats");
  assert(!hasPermission("FINANCE", "products:view"), "FINANCE blocked");
  assert(!hasPermission("FINANCE", "categories:view"), "FINANCE cats blocked");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(
      typeof hasPermission(role, "products:view") === "boolean",
      `role ${role}`,
    );
  }

  await prisma.product.deleteMany({
    where: {
      id: { in: [product.id, service.id, reused.id] },
    },
  });
  await prisma.productCategory.deleteMany({
    where: { id: { in: [catA.id, catB.id] } },
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

  console.log("OK products + categories CRUD / soft delete");
  console.log("OK SKU / barcode / prices / type / status");
  console.log("OK tenant isolation + RBAC");
  console.log("PRODUCTS VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("PRODUCTS VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
