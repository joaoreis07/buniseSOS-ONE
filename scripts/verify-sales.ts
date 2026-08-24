/**
 * Sales verification (FASE 7) — BusinessOS One only.
 * Run: npm run verify:sales
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { computeSaleTotals } from "../src/modules/sales/lib/sale-totals";
import {
  cancelSaleForTenant,
  completeSaleForTenant,
} from "../src/modules/sales/services/sale.service";

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

  const totals = computeSaleTotals(
    [
      { quantity: 2, unitPrice: 10, discountAmount: 1 },
      { quantity: 1, unitPrice: 5 },
    ],
    2,
  );
  assert(totals.subtotal === 24, "subtotal");
  assert(totals.discountAmount === 2, "discount");
  assert(totals.total === 22, "total");

  let negativeBlocked = false;
  try {
    computeSaleTotals([{ quantity: 1, unitPrice: 10 }], 20);
  } catch {
    negativeBlocked = true;
  }
  assert(negativeBlocked, "discount cannot exceed subtotal");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `sale-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Sale A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `sale-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Sale B ${suffix}`,
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Venda ${suffix}`,
      status: "ACTIVE",
    },
  });
  const physical = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Venda ${suffix}`,
      sku: `SAL-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 20,
      costPrice: 8,
    },
  });
  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço Venda ${suffix}`,
      sku: `SRV-S-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 50,
    },
  });
  const foreignProduct = await prisma.product.create({
    data: {
      companyId: b.company.id,
      name: `Produto B ${suffix}`,
      sku: `SAL-B-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 15,
    },
  });

  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: physical.id,
      quantity: 10,
      minimumQuantity: 1,
    },
  });

  const sale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "PIX",
      discountAmount: 5,
      notes: "Venda teste",
      items: [
        { productId: physical.id, quantity: 3, discountAmount: 0 },
        { productId: service.id, quantity: 1, discountAmount: 0 },
      ],
    },
  });
  assert(sale.status === "COMPLETED", "completed");
  assert(Number(sale.total) === 105, "server total 20*3 + 50 - 5");

  const stockAfter = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockAfter.quantity === 7, "physical stock reduced");

  const serviceMovements = await prisma.inventoryMovement.count({
    where: { productId: service.id },
  });
  assert(serviceMovements === 0, "service does not move stock");

  const exits = await prisma.inventoryMovement.findMany({
    where: { saleId: sale.id, type: "EXIT" },
  });
  assert(exits.length === 1 && exits[0].quantity === 3, "exit linked to sale");

  const walkIn = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  assert(walkIn.customerId === null, "sale without customer");

  let oversold = false;
  try {
    await completeSaleForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      data: {
        customerId: null,
        paymentMethod: "PIX",
        discountAmount: 0,
        notes: null,
        items: [{ productId: physical.id, quantity: 999, discountAmount: 0 }],
      },
    });
  } catch {
    oversold = true;
  }
  assert(oversold, "negative stock blocked");
  const stockUnchanged = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockUnchanged.quantity === 7, "failed sale leaves stock intact");

  let crossTenant = false;
  try {
    await completeSaleForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      data: {
        customerId: null,
        paymentMethod: "PIX",
        discountAmount: 0,
        notes: null,
        items: [{ productId: foreignProduct.id, quantity: 1, discountAmount: 0 }],
      },
    });
  } catch {
    crossTenant = true;
  }
  assert(crossTenant, "cannot sell other tenant product");

  let noCreate = false;
  try {
    await completeSaleForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "FINANCE",
      data: {
        customerId: null,
        paymentMethod: "PIX",
        discountAmount: 0,
        notes: null,
        items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
      },
    });
  } catch {
    noCreate = true;
  }
  assert(noCreate, "FINANCE cannot create sale");

  await cancelSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    saleId: sale.id,
  });
  const cancelled = await prisma.sale.findUniqueOrThrow({
    where: { id: sale.id },
  });
  assert(cancelled.status === "CANCELLED", "cancelled preserved");
  const stockRestored = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockRestored.quantity === 10, "cancel returns stock");

  const hidden = await prisma.sale.findFirst({
    where: { id: sale.id, companyId: b.company.id },
  });
  assert(!hidden, "tenant isolation");

  let noCancel = false;
  try {
    await cancelSaleForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "INVENTORY",
      saleId: walkIn.id,
    });
  } catch {
    noCancel = true;
  }
  assert(noCancel, "INVENTORY cannot cancel");

  assert(hasPermission("SALES", "sales:create"), "SALES create");
  assert(hasPermission("SALES", "sales:cancel"), "SALES cancel");
  assert(hasPermission("FINANCE", "sales:view"), "FINANCE view");
  assert(!hasPermission("FINANCE", "sales:create"), "FINANCE no create");
  assert(!hasPermission("INVENTORY", "sales:view"), "INVENTORY no sales");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(typeof hasPermission(role, "sales:view") === "boolean", `role ${role}`);
  }

  await prisma.inventoryMovement.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.saleItem.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.sale.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.inventory.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.product.deleteMany({
    where: { id: { in: [physical.id, service.id, foreignProduct.id] } },
  });
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

  console.log("OK sales totals + complete/cancel");
  console.log("OK stock EXIT/RETURN + service skipped");
  console.log("OK tenant + RBAC + failed sale atomic");
  console.log("SALES VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("SALES VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
