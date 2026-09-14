/**
 * Finance verification (FASE 8) — BusinessOS One only.
 * Run: npm run verify:finance
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { splitCents, toCents } from "../src/modules/finance/lib/money";
import { hasPermission } from "../src/shared/permissions/rbac";
import {
  createReceivableForSale,
  getReceivableForTenant,
  receiveInstallmentPayment,
} from "../src/modules/finance/services/finance.service";
import {
  cancelSaleForTenant,
  completeSaleForTenant,
} from "../src/modules/sales/services/sale.service";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function tenant(name: string, suffix: string) {
  const user = await prisma.user.create({
    data: {
      name,
      email: `${name.toLowerCase().replace(/\s+/g, "-")}-${suffix}@example.com`,
      passwordHash: "verification",
    },
  });
  const company = await prisma.company.create({
    data: { name: `${name} ${suffix}` },
  });
  await prisma.membership.create({
    data: { userId: user.id, companyId: company.id, role: "ADMIN" },
  });
  return { user, company };
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  assert(
    JSON.stringify(splitCents(100000, 3)) ===
      JSON.stringify([33333, 33333, 33334]),
    "R$ 1000 / 3 distributes leftover cents to the last installment",
  );
  assert(
    JSON.stringify(splitCents(100000, 2)) === JSON.stringify([50000, 50000]),
    "R$ 1000 / 2 splits evenly",
  );
  assert(
    splitCents(100000, 3).reduce((sum, value) => sum + value, 0) === 100000,
    "installment cents sum to total",
  );

  assert(hasPermission("FINANCE", "finance:view"), "FINANCE view");
  assert(hasPermission("FINANCE", "finance:receive"), "FINANCE receive");
  assert(hasPermission("FINANCE", "finance:cancel"), "FINANCE cancel");
  assert(!hasPermission("SALES", "finance:receive"), "SALES cannot receive");
  assert(!hasPermission("INVENTORY", "finance:view"), "INVENTORY no finance");
  assert(hasPermission("MANAGER", "finance:manage"), "MANAGER finance");

  const suffix = randomBytes(4).toString("hex");
  const a = await tenant("Finance A", suffix);
  const b = await tenant("Finance B", suffix);
  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço ${suffix}`,
      sku: `FIN-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 1000,
    },
  });
  const physical = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto ${suffix}`,
      sku: `FINP-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 200,
    },
  });
  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: physical.id,
      quantity: 5,
      minimumQuantity: 0,
    },
  });
  const foreign = await prisma.product.create({
    data: {
      companyId: b.company.id,
      name: `Serviço B ${suffix}`,
      sku: `FIN-B-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 100,
    },
  });

  const cashSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "PIX",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const cashAccount = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: cashSale.id },
    include: { installments: { include: { payments: true } } },
  });
  assert(
    cashAccount.status === "PAID" && Number(cashAccount.remainingAmount) === 0,
    "cash sale creates paid receivable",
  );
  assert(
    cashAccount.installments.length === 1 &&
      cashAccount.installments[0].status === "PAID" &&
      cashAccount.installments[0].payments.length === 1 &&
      Number(cashAccount.installments[0].payments[0].amount) === 1000,
    "cash sale keeps a full payment history",
  );

  let duplicateBlocked = false;
  try {
    await prisma.$transaction((tx) =>
      createReceivableForSale(tx, {
        companyId: a.company.id,
        userId: a.user.id,
        sale: cashSale,
        paymentMode: "CASH",
        installmentsCount: 1,
        period: "MONTHLY",
      }),
    );
  } catch {
    duplicateBlocked = true;
  }
  assert(duplicateBlocked, "duplicate receivable for the same sale is blocked");

  const twoSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "PIX",
      paymentMode: "INSTALLMENT",
      installmentsCount: 2,
      firstDueDate: "2026-12-10",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const twoAccount = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: twoSale.id },
    include: { installments: { orderBy: { number: "asc" } } },
  });
  assert(twoAccount.installments.length === 2, "2 installments created");
  assert(
    JSON.stringify(twoAccount.installments.map((item) => Number(item.amount))) ===
      JSON.stringify([500, 500]),
    "2 installments split evenly",
  );

  const installmentSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "PIX",
      paymentMode: "INSTALLMENT",
      installmentsCount: 3,
      firstDueDate: "2026-12-10",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const account = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: installmentSale.id },
    include: { installments: { orderBy: { number: "asc" } } },
  });
  assert(
    account.status === "PENDING" && account.installments.length === 3,
    "installment account created",
  );
  assert(
    JSON.stringify(account.installments.map((item) => Number(item.amount))) ===
      JSON.stringify([333.33, 333.33, 333.34]),
    "installment sum and rounding",
  );
  assert(
    toCents(account.installments.reduce((sum, item) => sum + Number(item.amount), 0)) ===
      toCents(account.totalAmount),
    "sum(installments) = sale total",
  );

  const first = account.installments[0];
  let overpayBlocked = false;
  try {
    await receiveInstallmentPayment({
      companyId: a.company.id,
      userId: a.user.id,
      role: "FINANCE",
      data: {
        installmentId: first.id,
        amount: 400,
        paymentMethod: "PIX",
        notes: null,
      },
    });
  } catch {
    overpayBlocked = true;
  }
  assert(overpayBlocked, "payment above remaining balance is blocked");

  let missingBlocked = false;
  try {
    await receiveInstallmentPayment({
      companyId: a.company.id,
      userId: a.user.id,
      role: "FINANCE",
      data: {
        installmentId: "clmissinginstallment000001",
        amount: 1,
        paymentMethod: "PIX",
        notes: null,
      },
    });
  } catch {
    missingBlocked = true;
  }
  assert(missingBlocked, "unknown installment is blocked");

  await receiveInstallmentPayment({
    companyId: a.company.id,
    userId: a.user.id,
    role: "FINANCE",
    data: {
      installmentId: first.id,
      amount: 100,
      paymentMethod: "PIX",
      notes: "Parcial",
    },
  });
  const refreshed = await prisma.accountReceivable.findUniqueOrThrow({
    where: { id: account.id },
    include: { installments: true },
  });
  const partialInstallment = refreshed.installments.find(
    (item) => item.id === first.id,
  );
  assert(
    partialInstallment &&
      Number(partialInstallment.paidAmount) === 100 &&
      Number(partialInstallment.remainingAmount) === 233.33 &&
      partialInstallment.status === "PARTIAL",
    "partial payment",
  );
  assert(
    Number(refreshed.paidAmount) === 100 &&
      Number(refreshed.remainingAmount) === 900,
    "account invariant after partial payment",
  );

  await receiveInstallmentPayment({
    companyId: a.company.id,
    userId: a.user.id,
    role: "FINANCE",
    data: {
      installmentId: first.id,
      amount: 233.33,
      paymentMethod: "CASH",
      notes: null,
    },
  });
  for (const item of account.installments.slice(1)) {
    await receiveInstallmentPayment({
      companyId: a.company.id,
      userId: a.user.id,
      role: "FINANCE",
      data: {
        installmentId: item.id,
        amount: Number(item.remainingAmount),
        paymentMethod: "PIX",
        notes: null,
      },
    });
  }
  const settled = await prisma.accountReceivable.findUniqueOrThrow({
    where: { id: account.id },
    include: { installments: { include: { payments: true } } },
  });
  assert(
    settled.status === "PAID" &&
      Number(settled.paidAmount) === 1000 &&
      Number(settled.remainingAmount) === 0,
    "settlement updates account",
  );
  assert(
    settled.installments.reduce(
      (sum, item) =>
        sum +
        item.payments.reduce(
          (paid, payment) => paid + Number(payment.amount),
          0,
        ),
      0,
    ) === 1000,
    "payment history equals paid amount",
  );

  const overdueSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "PIX",
      paymentMode: "INSTALLMENT",
      installmentsCount: 1,
      firstDueDate: "2026-01-01",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const overdue = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: overdueSale.id },
  });
  const overdueView = await getReceivableForTenant({
    companyId: a.company.id,
    role: "FINANCE",
    id: overdue.id,
  });
  assert(
    overdueView?.status === "OVERDUE" &&
      overdueView.installments[0]?.status === "OVERDUE",
    "overdue status is calculated server-side",
  );

  const cancelledSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "PIX",
      paymentMode: "INSTALLMENT",
      installmentsCount: 2,
      firstDueDate: "2026-12-10",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const cancellable = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: cancelledSale.id },
    include: { installments: true },
  });
  await receiveInstallmentPayment({
    companyId: a.company.id,
    userId: a.user.id,
    role: "FINANCE",
    data: {
      installmentId: cancellable.installments[0].id,
      amount: 50,
      paymentMethod: "PIX",
      notes: null,
    },
  });
  await cancelSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    saleId: cancelledSale.id,
  });
  const cancelled = await prisma.accountReceivable.findUniqueOrThrow({
    where: { id: cancellable.id },
    include: { installments: { include: { payments: true } } },
  });
  assert(
    cancelled.status === "CANCELLED" &&
      cancelled.installments.every((item) => item.status === "CANCELLED"),
    "sale cancellation cancels receivable and installments",
  );
  assert(
    cancelled.installments.find((item) => item.id === cancellable.installments[0].id)
      ?.payments.length === 1,
    "cancellation preserves payment history",
  );

  let receiveCancelledBlocked = false;
  try {
    await receiveInstallmentPayment({
      companyId: a.company.id,
      userId: a.user.id,
      role: "FINANCE",
      data: {
        installmentId: cancellable.installments[1].id,
        amount: 1,
        paymentMethod: "PIX",
        notes: null,
      },
    });
  } catch {
    receiveCancelledBlocked = true;
  }
  assert(receiveCancelledBlocked, "cancelled receivable cannot receive payment");

  const stockSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: physical.id, quantity: 2, discountAmount: 0 }],
    },
  });
  const stockAfterSale = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockAfterSale.quantity === 3, "physical sale reduces stock");
  await cancelSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    saleId: stockSale.id,
  });
  const stockAfterCancel = await prisma.inventory.findUniqueOrThrow({
    where: { productId: physical.id },
  });
  assert(stockAfterCancel.quantity === 5, "cancel returns stock");
  const cancelledCash = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: stockSale.id },
    include: { installments: { include: { payments: true } } },
  });
  assert(
    cancelledCash.status === "CANCELLED" &&
      cancelledCash.installments.every((item) => item.status === "CANCELLED") &&
      cancelledCash.installments[0].payments.length === 1,
    "cash sale cancel marks finance cancelled and keeps payment history",
  );

  let foreignBlocked = false;
  try {
    await receiveInstallmentPayment({
      companyId: b.company.id,
      userId: b.user.id,
      role: "FINANCE",
      data: {
        installmentId: twoAccount.installments[0].id,
        amount: 1,
        paymentMethod: "PIX",
        notes: null,
      },
    });
  } catch {
    foreignBlocked = true;
  }
  assert(foreignBlocked, "cross-tenant payment blocked");

  let forbiddenSale = false;
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
        items: [{ productId: foreign.id, quantity: 1, discountAmount: 0 }],
      },
    });
  } catch {
    forbiddenSale = true;
  }
  assert(forbiddenSale, "finance role cannot create sale");

  let inventoryBlocked = false;
  try {
    await receiveInstallmentPayment({
      companyId: a.company.id,
      userId: a.user.id,
      role: "INVENTORY",
      data: {
        installmentId: twoAccount.installments[0].id,
        amount: 1,
        paymentMethod: "PIX",
        notes: null,
      },
    });
  } catch {
    inventoryBlocked = true;
  }
  assert(inventoryBlocked, "INVENTORY cannot receive payments");

  let salesReceiveBlocked = false;
  try {
    await receiveInstallmentPayment({
      companyId: a.company.id,
      userId: a.user.id,
      role: "SALES",
      data: {
        installmentId: twoAccount.installments[0].id,
        amount: 1,
        paymentMethod: "PIX",
        notes: null,
      },
    });
  } catch {
    salesReceiveBlocked = true;
  }
  assert(salesReceiveBlocked, "SALES cannot receive payments");

  const auditCount = await prisma.auditLog.count({
    where: { companyId: a.company.id, module: "finance" },
  });
  assert(auditCount >= 8, "financial audit history created");

  await prisma.installmentPayment.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.installment.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
  await prisma.accountReceivable.deleteMany({
    where: { companyId: { in: [a.company.id, b.company.id] } },
  });
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
    where: { id: { in: [service.id, physical.id, foreign.id] } },
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

  console.log("OK cash + installment + rounding");
  console.log("OK partial payment + settlement + overdue");
  console.log("OK cancel preserves history + stock RETURN");
  console.log("OK RBAC + tenant + overpay + idempotency");
  console.log("FINANCE VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error("FINANCE VERIFY FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
