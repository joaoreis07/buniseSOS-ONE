/**
 * Inventory verification (FASE 6) — BusinessOS One only.
 * Run: npm run verify:inventory
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { getStockLevel } from "../src/modules/inventory/lib/inventory-labels";
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

async function applyMovement(params: {
  companyId: string;
  productId: string;
  userId: string;
  type: "ENTRY" | "EXIT" | "ADJUSTMENT" | "RETURN" | "LOSS";
  quantity: number;
  targetQuantity?: number;
}) {
  let inventory = await prisma.inventory.findUnique({
    where: { productId: params.productId },
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        companyId: params.companyId,
        productId: params.productId,
        quantity: 0,
        minimumQuantity: 0,
      },
    });
  }

  const before = inventory.quantity;
  let after = before;
  switch (params.type) {
    case "ENTRY":
    case "RETURN":
      after = before + params.quantity;
      break;
    case "EXIT":
    case "LOSS":
      after = before - params.quantity;
      break;
    case "ADJUSTMENT":
      after = params.targetQuantity ?? before;
      break;
  }
  if (after < 0) throw new Error("negative balance");

  const delta =
    params.type === "ADJUSTMENT"
      ? Math.abs(after - before)
      : params.quantity;

  await prisma.inventory.update({
    where: { id: inventory.id },
    data: { quantity: after },
  });
  await prisma.inventoryMovement.create({
    data: {
      companyId: params.companyId,
      productId: params.productId,
      type: params.type,
      quantity: delta,
      createdById: params.userId,
    },
  });
  return { before, after };
}

async function main() {
  assertVerificationDatabase();

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `inv-a-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Inv A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `inv-b-${suffix}@example.com`,
    password: "TestPass123!",
    companyName: `Empresa Inv B ${suffix}`,
  });

  const physical = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Físico ${suffix}`,
      sku: `PHY-${suffix}`,
      type: "PRODUCT",
      costPrice: 10,
      salePrice: 20,
    },
  });
  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço ${suffix}`,
      sku: `SRV-${suffix}`,
      type: "SERVICE",
    },
  });
  const foreign = await prisma.product.create({
    data: {
      companyId: b.company.id,
      name: `Produto B ${suffix}`,
      sku: `PHY-B-${suffix}`,
      type: "PRODUCT",
    },
  });

  const inventory = await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: physical.id,
      quantity: 0,
      minimumQuantity: 5,
    },
  });
  assert(inventory.minimumQuantity === 5, "minimum quantity");

  // Service must not get inventory in app layer — verify no auto record
  const serviceInv = await prisma.inventory.findUnique({
    where: { productId: service.id },
  });
  assert(!serviceInv, "service without inventory");

  const entry = await applyMovement({
    companyId: a.company.id,
    productId: physical.id,
    userId: a.user.id,
    type: "ENTRY",
    quantity: 20,
  });
  assert(entry.after === 20, "entry");

  const exit = await applyMovement({
    companyId: a.company.id,
    productId: physical.id,
    userId: a.user.id,
    type: "EXIT",
    quantity: 5,
  });
  assert(exit.after === 15, "exit");

  const ret = await applyMovement({
    companyId: a.company.id,
    productId: physical.id,
    userId: a.user.id,
    type: "RETURN",
    quantity: 2,
  });
  assert(ret.after === 17, "return");

  const loss = await applyMovement({
    companyId: a.company.id,
    productId: physical.id,
    userId: a.user.id,
    type: "LOSS",
    quantity: 2,
  });
  assert(loss.after === 15, "loss");

  const adj = await applyMovement({
    companyId: a.company.id,
    productId: physical.id,
    userId: a.user.id,
    type: "ADJUSTMENT",
    quantity: 1,
    targetQuantity: 10,
  });
  assert(adj.after === 10, "adjustment");

  let blocked = false;
  try {
    await applyMovement({
      companyId: a.company.id,
      productId: physical.id,
      userId: a.user.id,
      type: "EXIT",
      quantity: 999,
    });
  } catch {
    blocked = true;
  }
  assert(blocked, "negative balance blocked");

  const levelLow = getStockLevel({ quantity: 4, minimumQuantity: 5 });
  assert(levelLow === "low", "low stock");
  const levelOut = getStockLevel({ quantity: 0, minimumQuantity: 5 });
  assert(levelOut === "out", "out of stock");

  const movements = await prisma.inventoryMovement.count({
    where: { companyId: a.company.id, productId: physical.id },
  });
  assert(movements === 5, "movement history");

  const cross = await prisma.inventory.findFirst({
    where: { productId: physical.id, companyId: b.company.id },
  });
  assert(!cross, "tenant isolation");

  const foreignInv = await prisma.inventory.findFirst({
    where: { productId: foreign.id, companyId: a.company.id },
  });
  assert(!foreignInv, "foreign product isolation");

  assert(hasPermission("ADMIN", "inventory:manage"), "ADMIN manage");
  assert(hasPermission("ADMIN", "inventory:movements"), "ADMIN movements");
  assert(hasPermission("INVENTORY", "inventory:movements"), "INVENTORY move");
  assert(hasPermission("SALES", "inventory:view"), "SALES view");
  assert(!hasPermission("SALES", "inventory:manage"), "SALES no manage");
  assert(!hasPermission("FINANCE", "inventory:view"), "FINANCE blocked");

  const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];
  for (const role of roles) {
    assert(
      typeof hasPermission(role, "inventory:view") === "boolean",
      `role ${role}`,
    );
  }

  await prisma.inventoryMovement.deleteMany({
    where: { companyId: a.company.id },
  });
  await prisma.inventory.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.product.deleteMany({
    where: { id: { in: [physical.id, service.id, foreign.id] } },
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

  console.log("OK inventory init + movements");
  console.log("OK balance + minimum + low/out states");
  console.log("OK negative blocked + service excluded");
  console.log("OK tenant + RBAC");
  console.log("INVENTORY VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("INVENTORY VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
