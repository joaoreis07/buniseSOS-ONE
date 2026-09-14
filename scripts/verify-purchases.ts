/**
 * Purchases + suppliers verification (FASE 9) — BusinessOS One only.
 * Run: npm run verify:purchases
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import {
  createSupplierForTenant,
  updateSupplierForTenant,
} from "../src/modules/purchases/services/supplier.service";
import {
  cancelPurchaseForTenant,
  createPurchaseForTenant,
  receivePurchaseForTenant,
} from "../src/modules/purchases/services/purchase.service";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function registerTenant(input: {
  name: string;
  email: string;
  companyName: string;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email.toLowerCase(), passwordHash },
    });
    const company = await tx.company.create({ data: { name: input.companyName } });
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

  assert(hasPermission("INVENTORY", "purchases:view"), "INVENTORY view purchases");
  assert(hasPermission("INVENTORY", "purchases:receive"), "INVENTORY receive");
  assert(!hasPermission("INVENTORY", "purchases:create"), "INVENTORY no create");
  assert(!hasPermission("SALES", "purchases:view"), "SALES no purchases");
  assert(!hasPermission("FINANCE", "purchases:view"), "FINANCE no purchases");
  assert(hasPermission("MANAGER", "suppliers:manage"), "MANAGER suppliers");
  assert(!hasPermission("SALES", "suppliers:manage"), "SALES no suppliers");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `pur-a-${suffix}@example.com`,
    companyName: `Empresa Purchase A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `pur-b-${suffix}@example.com`,
    companyName: `Empresa Purchase B ${suffix}`,
  });

  const supplier = await createSupplierForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      name: `Fornecedor ${suffix}`,
      tradeName: "Fantasia",
      document: "12345678000195",
      email: `forn-${suffix}@example.com`,
      phone: "1133334444",
      mobile: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      district: null,
      city: "São Paulo",
      state: "SP",
      country: "BR",
      status: "ACTIVE",
      notes: null,
    },
  });
  const updated = await updateSupplierForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    supplierId: supplier.id,
    data: {
      name: supplier.name,
      tradeName: supplier.tradeName,
      document: supplier.document,
      email: supplier.email,
      phone: supplier.phone,
      mobile: supplier.mobile,
      zipCode: supplier.zipCode,
      street: supplier.street,
      number: supplier.number,
      complement: supplier.complement,
      district: supplier.district,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      status: supplier.status,
      notes: "Atualizado",
    },
  });
  assert(updated.notes === "Atualizado", "supplier update");

  const foreignSupplier = await createSupplierForTenant({
    companyId: b.company.id,
    userId: b.user.id,
    role: "ADMIN",
    data: {
      name: `Fornecedor B ${suffix}`,
      tradeName: null,
      document: null,
      email: null,
      phone: null,
      mobile: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      district: null,
      city: null,
      state: null,
      country: "BR",
      status: "ACTIVE",
      notes: null,
    },
  });

  const physical = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Compra ${suffix}`,
      sku: `PUR-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 30,
      costPrice: 10,
    },
  });
  const physical2 = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto Compra 2 ${suffix}`,
      sku: `PUR2-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 20,
      costPrice: 5,
    },
  });
  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço Compra ${suffix}`,
      sku: `PSRV-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 80,
      costPrice: 0,
    },
  });
  const foreignProduct = await prisma.product.create({
    data: {
      companyId: b.company.id,
      name: `Produto B ${suffix}`,
      sku: `PUR-B-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 15,
      costPrice: 7,
    },
  });
  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: physical.id,
      quantity: 2,
      minimumQuantity: 0,
    },
  });

  const draft = await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      supplierId: supplier.id,
      discountAmount: 5,
      notes: "Rascunho",
      items: [
        { productId: physical.id, quantity: 3, unitCost: 12, discountAmount: 0 },
        { productId: physical2.id, quantity: 2, unitCost: 8, discountAmount: 0 },
      ],
    },
  });
  assert(draft.status === "DRAFT", "draft created");
  assert(Number(draft.total) === 12 * 3 + 8 * 2 - 5, "server totals");
  const stockBeforeReceive = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockBeforeReceive.quantity === 2, "draft does not move stock");

  const snapshot = await prisma.purchaseItem.findFirstOrThrow({
    where: { purchaseId: draft.id, productId: physical.id },
  });
  await prisma.product.update({
    where: { id: physical.id },
    data: { name: "Nome alterado depois", sku: `CHANGED-${suffix}` },
  });
  const snapshotAfter = await prisma.purchaseItem.findFirstOrThrow({
    where: { id: snapshot.id },
  });
  assert(snapshotAfter.productName === `Produto Compra ${suffix}`, "snapshot name");
  assert(snapshotAfter.productSku === `PUR-${suffix}`, "snapshot sku");

  await receivePurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "INVENTORY",
    purchaseId: draft.id,
  });
  const received = await prisma.purchase.findUniqueOrThrow({
    where: { id: draft.id },
  });
  assert(received.status === "RECEIVED", "received");
  const stockAfter = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockAfter.quantity === 5, "ENTRY +3");
  const entries = await prisma.inventoryMovement.findMany({
    where: { purchaseId: draft.id, type: "ENTRY" },
  });
  assert(entries.length === 2, "two physical ENTRY movements");
  const updatedCost = await prisma.product.findUniqueOrThrow({
    where: { id: physical.id },
  });
  assert(Number(updatedCost.costPrice) === 12, "last cost updated, sale price untouched");
  assert(Number(updatedCost.salePrice) === 30, "sale price preserved");

  let doubleReceive = false;
  try {
    await receivePurchaseForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      purchaseId: draft.id,
    });
  } catch {
    doubleReceive = true;
  }
  assert(doubleReceive, "duplicate receive blocked");
  const entryCount = await prisma.inventoryMovement.count({
    where: { purchaseId: draft.id, type: "ENTRY" },
  });
  assert(entryCount === 2, "no extra ENTRY after duplicate receive");

  let serviceBlocked = false;
  try {
    await createPurchaseForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      data: {
        supplierId: supplier.id,
        discountAmount: 0,
        notes: null,
        items: [{ productId: service.id, quantity: 1, unitCost: 10, discountAmount: 0 }],
      },
    });
  } catch {
    serviceBlocked = true;
  }
  assert(serviceBlocked, "service cannot be purchased as goods");

  let foreignProductBlocked = false;
  try {
    await createPurchaseForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      data: {
        supplierId: supplier.id,
        discountAmount: 0,
        notes: null,
        items: [
          { productId: foreignProduct.id, quantity: 1, unitCost: 7, discountAmount: 0 },
        ],
      },
    });
  } catch {
    foreignProductBlocked = true;
  }
  assert(foreignProductBlocked, "cannot buy other tenant product");

  let foreignSupplierBlocked = false;
  try {
    await createPurchaseForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      data: {
        supplierId: foreignSupplier.id,
        discountAmount: 0,
        notes: null,
        items: [{ productId: physical.id, quantity: 1, unitCost: 10, discountAmount: 0 }],
      },
    });
  } catch {
    foreignSupplierBlocked = true;
  }
  assert(foreignSupplierBlocked, "cannot use other tenant supplier");

  let salesBlocked = false;
  try {
    await createPurchaseForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "SALES",
      data: {
        supplierId: supplier.id,
        discountAmount: 0,
        notes: null,
        items: [{ productId: physical.id, quantity: 1, unitCost: 10, discountAmount: 0 }],
      },
    });
  } catch {
    salesBlocked = true;
  }
  assert(salesBlocked, "SALES cannot create purchases");

  const receivedPurchase = await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    receive: true,
    data: {
      supplierId: supplier.id,
      discountAmount: 0,
      notes: null,
      items: [{ productId: physical.id, quantity: 1, unitCost: 11, discountAmount: 0 }],
    },
  });
  assert(receivedPurchase.status === "RECEIVED", "create+receive atomic");
  const stockAfterImmediate = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockAfterImmediate.quantity === 6, "immediate receive ENTRY");

  await cancelPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    purchaseId: receivedPurchase.id,
  });
  const cancelled = await prisma.purchase.findUniqueOrThrow({
    where: { id: receivedPurchase.id },
  });
  assert(cancelled.status === "CANCELLED", "cancelled preserved");
  const stockAfterCancel = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockAfterCancel.quantity === 5, "RETURN restores stock");
  const exits = await prisma.inventoryMovement.count({
    where: { purchaseId: receivedPurchase.id, type: "EXIT" },
  });
  assert(exits === 1, "EXIT linked to cancelled purchase");

  const overstock = await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    receive: true,
    data: {
      supplierId: supplier.id,
      discountAmount: 0,
      notes: null,
      items: [{ productId: physical.id, quantity: 4, unitCost: 10, discountAmount: 0 }],
    },
  });
  await prisma.inventory.update({
    where: { productId: physical.id },
    data: { quantity: 1 },
  });
  let negativeBlocked = false;
  try {
    await cancelPurchaseForTenant({
      companyId: a.company.id,
      userId: a.user.id,
      role: "ADMIN",
      purchaseId: overstock.id,
    });
  } catch {
    negativeBlocked = true;
  }
  assert(negativeBlocked, "cancel blocked when stock would go negative");
  const stillReceived = await prisma.purchase.findUniqueOrThrow({
    where: { id: overstock.id },
  });
  assert(stillReceived.status === "RECEIVED", "failed cancel leaves purchase received");

  const hidden = await prisma.purchase.findFirst({
    where: { id: draft.id, companyId: b.company.id },
  });
  assert(!hidden, "tenant isolation");

  const auditCount = await prisma.auditLog.count({
    where: { companyId: a.company.id, module: "purchases" },
  });
  assert(auditCount >= 4, "purchase audit history");

  await prisma.inventoryMovement.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.purchaseItem.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.purchase.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.inventory.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.product.deleteMany({
    where: { id: { in: [physical.id, physical2.id, service.id, foreignProduct.id] } },
  });
  await prisma.supplier.deleteMany({
    where: { id: { in: [supplier.id, foreignSupplier.id] } },
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

  console.log("OK suppliers + tenant + RBAC");
  console.log("OK purchase totals + snapshot + draft no stock");
  console.log("OK receive ENTRY + duplicate blocked + last cost");
  console.log("OK cancel EXIT + negative stock blocked");
  console.log("PURCHASES VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("PURCHASES VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
