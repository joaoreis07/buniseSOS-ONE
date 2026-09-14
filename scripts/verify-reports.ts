/**
 * Dashboard + reports verification (FASE 10) — BusinessOS One only.
 * Run: npm run verify:reports
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { hasPermission } from "../src/shared/permissions/rbac";
import { numericChange } from "../src/modules/reports/lib/change";
import { toCsv } from "../src/modules/reports/lib/csv";
import { resolvePeriod } from "../src/modules/reports/lib/period";
import { getDashboardForTenant } from "../src/modules/reports/services/dashboard.service";
import {
  exportReportCsv,
  getFinanceReportForTenant,
  getInventoryReportForTenant,
  getPurchasesReportForTenant,
  getSalesReportForTenant,
} from "../src/modules/reports/services/reports.service";
import {
  cancelSaleForTenant,
  completeSaleForTenant,
} from "../src/modules/sales/services/sale.service";
import { receiveInstallmentPayment } from "../src/modules/finance/services/finance.service";
import { createSupplierForTenant } from "../src/modules/purchases/services/supplier.service";
import {
  cancelPurchaseForTenant,
  createPurchaseForTenant,
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
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });
    const company = await tx.company.create({ data: { name: input.companyName } });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    return { user, company };
  });
}

async function expectThrow(fn: () => Promise<unknown>, message: string) {
  let thrown = false;
  try {
    await fn();
  } catch {
    thrown = true;
  }
  assert(thrown, message);
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

  const today = new Date(2026, 8, 14, 15, 0, 0);
  const todayRange = resolvePeriod({ preset: "today", now: today });
  assert(
    todayRange.start.getDate() === 14 && todayRange.end.getDate() === 14,
    "today range is civil day",
  );
  const last30 = resolvePeriod({ preset: "last_30", now: today });
  assert(last30.start.getDate() === 16 && last30.start.getMonth() === 7, "last 30 start");
  const custom = resolvePeriod({
    preset: "custom",
    from: "2026-09-01",
    to: "2026-09-14",
    now: today,
  });
  assert(custom.start.getDate() === 1 && custom.end.getDate() === 14, "custom inclusive");
  let invalidDates = false;
  try {
    resolvePeriod({ preset: "custom", from: "2026-09-14", to: "2026-09-01" });
  } catch {
    invalidDates = true;
  }
  assert(invalidDates, "custom inverted dates rejected");

  const zero = numericChange(0, 0);
  assert(zero.label === "—" && zero.direction === "flat", "zero vs zero");
  const fresh = numericChange(10, 0);
  assert(fresh.label === "Novo" && fresh.direction === "up", "new vs zero");
  const up = numericChange(112, 100);
  assert(up.label === "+12%", "percent increase");
  const down = numericChange(80, 100);
  assert(down.label === "-20%", "percent decrease");

  const csv = toCsv(["Nome", "Valor"], [['A; "x"', 10], ["B", null]]);
  assert(csv.startsWith("\uFEFF"), "csv bom");
  assert(csv.includes("Nome;Valor"), "csv header");
  assert(csv.includes('"A; ""x"""'), "csv escaped quotes");

  assert(hasPermission("ADMIN", "dashboard:view"), "ADMIN dashboard");
  assert(hasPermission("MANAGER", "reports:view"), "MANAGER reports");
  assert(hasPermission("SALES", "reports:view"), "SALES reports");
  assert(hasPermission("FINANCE", "reports:view"), "FINANCE reports");
  assert(hasPermission("INVENTORY", "reports:view"), "INVENTORY reports");
  assert(!hasPermission("SALES", "finance:view"), "SALES no finance");
  assert(!hasPermission("INVENTORY", "sales:view"), "INVENTORY no sales");
  assert(!hasPermission("FINANCE", "inventory:view"), "FINANCE no inventory");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `rep-a-${suffix}@example.com`,
    companyName: `Empresa Reports A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `rep-b-${suffix}@example.com`,
    companyName: `Empresa Reports B ${suffix}`,
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente ${suffix}`,
      status: "ACTIVE",
    },
  });
  const service = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Serviço ${suffix}`,
      sku: `REP-S-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 100,
    },
  });
  const productA = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto A ${suffix}`,
      sku: `REP-A-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 20,
      costPrice: 8,
    },
  });
  const productLow = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto baixo ${suffix}`,
      sku: `REP-L-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 15,
      costPrice: 5,
    },
  });
  const productOut = await prisma.product.create({
    data: {
      companyId: a.company.id,
      name: `Produto zerado ${suffix}`,
      sku: `REP-O-${suffix}`,
      type: "PRODUCT",
      status: "ACTIVE",
      salePrice: 15,
      costPrice: 4,
    },
  });
  const foreign = await prisma.product.create({
    data: {
      companyId: b.company.id,
      name: `Serviço B ${suffix}`,
      sku: `REP-B-${suffix}`,
      type: "SERVICE",
      status: "ACTIVE",
      salePrice: 9999,
    },
  });

  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: productA.id,
      quantity: 50,
      minimumQuantity: 2,
    },
  });
  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: productLow.id,
      quantity: 2,
      minimumQuantity: 5,
    },
  });
  await prisma.inventory.create({
    data: {
      companyId: a.company.id,
      productId: productOut.id,
      quantity: 0,
      minimumQuantity: 3,
    },
  });

  const supplier = await createSupplierForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      name: `Fornecedor ${suffix}`,
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

  const receivedPurchase = await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    receive: true,
    data: {
      supplierId: supplier.id,
      discountAmount: 0,
      notes: null,
      items: [{ productId: productA.id, quantity: 10, unitCost: 8, discountAmount: 0 }],
    },
  });
  const draftToCancel = await createPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    receive: true,
    data: {
      supplierId: supplier.id,
      discountAmount: 0,
      notes: null,
      items: [{ productId: productA.id, quantity: 2, unitCost: 8, discountAmount: 0 }],
    },
  });
  await cancelPurchaseForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    purchaseId: draftToCancel.id,
  });

  const cashSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "PIX",
      paymentMode: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const productSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "CASH",
      paymentMode: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: productA.id, quantity: 3, discountAmount: 0 }],
    },
  });
  const overdueSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "TED",
      paymentMode: "INSTALLMENT",
      installmentsCount: 1,
      firstDueDate: "2020-01-10",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 2, discountAmount: 0 }],
    },
  });
  const cancelled = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "PIX",
      paymentMode: "INSTALLMENT",
      installmentsCount: 1,
      firstDueDate: "2026-12-01",
      period: "MONTHLY",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  await cancelSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    saleId: cancelled.id,
  });

  const previousSale = await completeSaleForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      customerId: customer.id,
      paymentMethod: "PIX",
      paymentMode: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: service.id, quantity: 1, discountAmount: 0 }],
    },
  });
  const fortyDaysAgo = new Date(today);
  fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
  await prisma.sale.update({
    where: { id: previousSale.id },
    data: { completedAt: fortyDaysAgo },
  });
  const previousAccount = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: previousSale.id },
    select: { id: true },
  });
  const previousInstallments = await prisma.installment.findMany({
    where: { accountReceivableId: previousAccount.id },
    select: { id: true },
  });
  await prisma.installmentPayment.updateMany({
    where: { installmentId: { in: previousInstallments.map((item) => item.id) } },
    data: { paidAt: fortyDaysAgo },
  });

  const foreignSale = await completeSaleForTenant({
    companyId: b.company.id,
    userId: b.user.id,
    role: "ADMIN",
    data: {
      customerId: null,
      paymentMethod: "PIX",
      paymentMode: "CASH",
      discountAmount: 0,
      notes: null,
      items: [{ productId: foreign.id, quantity: 1, discountAmount: 0 }],
    },
  });

  const overdueAccount = await prisma.accountReceivable.findUniqueOrThrow({
    where: { saleId: overdueSale.id },
    include: { installments: true },
  });
  await receiveInstallmentPayment({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      installmentId: overdueAccount.installments[0].id,
      amount: 50,
      paymentMethod: "PIX",
      notes: null,
    },
  });

  const dashboard = await getDashboardForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "last_30" },
    now: today,
  });
  assert(dashboard.sales, "admin sales section");
  assert(dashboard.finance, "admin finance section");
  assert(dashboard.inventory, "admin inventory section");
  assert(dashboard.purchases, "admin purchases section");
  assert(dashboard.sales.count === 3, "completed sales exclude cancelled and previous");
  assert(dashboard.sales.revenue === 360, "100 + 60 + 200");
  assert(dashboard.sales.ticket === 120, "ticket medio 360/3");
  assert(dashboard.sales.cancelled === 1, "cancelled counted apart");
  assert(dashboard.sales.countChange.previous === 1, "previous period has the backdated sale");
  assert(dashboard.sales.countChange.label === "+200%", "3 vs 1");

  const empty = await getDashboardForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "custom", from: "2010-01-01", to: "2010-01-02" },
    now: today,
  });
  assert(empty.sales?.count === 0, "empty period count");
  assert(empty.sales?.revenue === 0, "empty period revenue");
  assert(empty.sales?.countChange.label === "—", "empty vs empty");

  const todayDash = await getDashboardForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "today" },
    now: new Date(),
  });
  assert((todayDash.sales?.count ?? 0) >= 3, "today includes current sales");

  const top = dashboard.products.find((row) => row.productId === service.id);
  assert(top && top.quantity === 3, "service qty 1 + overdue 2, cancelled excluded");
  assert(top.revenue === 300, "service revenue 100+200");
  const rankedProduct = dashboard.products.find((row) => row.productId === productA.id);
  assert(rankedProduct && rankedProduct.quantity === 3, "physical units");

  const pix = dashboard.payments.find((row) => row.paymentMethod === "PIX");
  const cash = dashboard.payments.find((row) => row.paymentMethod === "CASH");
  const ted = dashboard.payments.find((row) => row.paymentMethod === "TED");
  assert(pix && pix.count === 1 && pix.revenue === 100, "pix completed only");
  assert(cash && cash.revenue === 60, "cash product sale");
  assert(ted && ted.revenue === 200, "ted installment still counts as sale");

  assert(dashboard.finance.received === 210, "cash 100+60 plus partial 50");
  assert(dashboard.finance.open >= 150, "installment remaining 150");
  assert(dashboard.finance.overdue >= 150, "overdue remaining");

  assert(dashboard.inventory.belowMinimum >= 1, "low stock");
  assert(dashboard.inventory.outOfStock >= 1, "out of stock");
  assert(
    dashboard.inventory.alerts.some((item) => item.productId === productLow.id),
    "low alert",
  );
  assert(
    dashboard.inventory.alerts.some((item) => item.productId === productOut.id),
    "out alert",
  );

  assert(dashboard.purchases.count === 1, "only received uncancelled purchase");
  assert(dashboard.purchases.value === 80, "10 * 8");
  assert(dashboard.purchases.cancelled === 1, "cancelled purchase excluded from value");
  assert(dashboard.purchases.activeSuppliers >= 1, "active supplier");

  const tenantB = await getDashboardForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "last_30" },
    now: today,
  });
  assert(tenantB.sales && tenantB.sales.revenue !== 9999, "no foreign revenue");
  const salesA = await getSalesReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "last_30", page: 1, pageSize: 20 },
    now: today,
  });
  assert(
    salesA.items.every((row) => row.id !== foreignSale.id),
    "sales report tenant isolation",
  );
  assert(
    salesA.items.every((row) => row.status !== "DRAFT"),
    "drafts excluded",
  );
  assert(
    salesA.items.some((row) => row.id === cancelled.id && row.status === "CANCELLED"),
    "cancelled listed when unfiltered",
  );

  const completedOnly = await getSalesReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "last_30", status: "COMPLETED", page: 1, pageSize: 20 },
    now: today,
  });
  assert(
    completedOnly.items.every((row) => row.status === "COMPLETED"),
    "status filter server-side",
  );

  const productFiltered = await getSalesReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: {
      preset: "last_30",
      productId: productA.id,
      page: 1,
      pageSize: 20,
    },
    now: today,
  });
  assert(
    productFiltered.items.length === 1 && productFiltered.items[0].id === productSale.id,
    "product filter",
  );

  const exported = await exportReportCsv({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    type: "sales",
    query: {
      preset: "last_30",
      productId: productA.id,
      page: 1,
      pageSize: 20,
    },
    now: today,
  });
  const saleNumber = String(productSale.number).padStart(5, "0");
  assert(exported.csv.includes(`V-${saleNumber}`), "csv has filtered sale");
  const otherNumber = String(cashSale.number).padStart(5, "0");
  assert(!exported.csv.includes(`V-${otherNumber}`), "csv respects product filter");
  const audit = await prisma.auditLog.findFirst({
    where: {
      companyId: a.company.id,
      action: "REPORT_EXPORTED",
      module: "reports",
    },
  });
  assert(audit, "export audited");

  const financeReport = await getFinanceReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "custom", from: "2020-01-01", to: "2020-01-31", page: 1, pageSize: 20 },
    now: today,
  });
  assert(financeReport.items.some((row) => row.saleId === overdueSale.id), "finance due date filter");
  assert(financeReport.items.some((row) => row.overdue && row.remainingAmount === 150), "overdue remaining");

  const inventoryReport = await getInventoryReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { stock: "low", page: 1, pageSize: 20 },
  });
  assert(
    inventoryReport.items.some((row) => row.productId === productLow.id),
    "inventory low filter",
  );
  assert(
    inventoryReport.items.every((row) => row.stockLevel === "low"),
    "only low rows",
  );

  const purchaseReport = await getPurchasesReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { preset: "last_30", status: "RECEIVED", page: 1, pageSize: 20 },
    now: today,
  });
  assert(
    purchaseReport.items.some((row) => row.purchaseId === receivedPurchase.id),
    "received purchase report",
  );
  assert(
    purchaseReport.items.every((row) => row.status === "RECEIVED"),
    "cancelled excluded by status",
  );

  const salesRole = await getDashboardForTenant({
    companyId: a.company.id,
    role: "SALES",
    query: { preset: "last_30" },
    now: today,
  });
  assert(salesRole.sales, "SALES sees sales");
  assert(!salesRole.finance, "SALES no finance");
  assert(!salesRole.purchases, "SALES no purchases");

  const financeRole = await getDashboardForTenant({
    companyId: a.company.id,
    role: "FINANCE",
    query: { preset: "last_30" },
    now: today,
  });
  assert(financeRole.sales && financeRole.finance, "FINANCE sales+finance");
  assert(!financeRole.inventory && !financeRole.purchases, "FINANCE no stock/purchases");

  const inventoryRole = await getDashboardForTenant({
    companyId: a.company.id,
    role: "INVENTORY",
    query: { preset: "last_30" },
    now: today,
  });
  assert(!inventoryRole.sales && !inventoryRole.finance, "INVENTORY no sales/finance");
  assert(inventoryRole.inventory && inventoryRole.purchases, "INVENTORY stock+purchases");

  await expectThrow(
    () =>
      getFinanceReportForTenant({
        companyId: a.company.id,
        role: "SALES",
        query: { preset: "last_30", page: 1, pageSize: 20 },
      }),
    "SALES cannot open finance report",
  );
  await expectThrow(
    () =>
      getSalesReportForTenant({
        companyId: a.company.id,
        role: "INVENTORY",
        query: { preset: "last_30", page: 1, pageSize: 20 },
      }),
    "INVENTORY cannot open sales report",
  );
  await expectThrow(
    () =>
      exportReportCsv({
        companyId: a.company.id,
        userId: a.user.id,
        role: "SALES",
        type: "finance",
        query: { preset: "last_30", page: 1, pageSize: 20 },
      }),
    "SALES cannot export finance",
  );

  console.log("OK verify:reports");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
