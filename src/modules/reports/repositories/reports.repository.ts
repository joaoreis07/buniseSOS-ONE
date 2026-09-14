import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { getStockLevel } from "@/modules/inventory/lib/inventory-labels";
import type { DateRange } from "@/modules/reports/lib/period";
import { intNumber, moneyNumber } from "@/modules/reports/lib/numbers";
import type {
  FinanceReportQuery,
  InventoryReportQuery,
  PurchasesReportQuery,
  SalesReportQuery,
} from "@/modules/reports/schemas/reports.schemas";

export const REPORT_EXPORT_LIMIT = 5000;

function pageMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function salesPeriodWhere(params: {
  companyId: string;
  range: DateRange;
  query: SalesReportQuery;
}): Prisma.SaleWhereInput {
  const status = params.query.status ?? undefined;
  const periodFilter: Prisma.SaleWhereInput = status
    ? status === "COMPLETED"
      ? { status: "COMPLETED", completedAt: { gte: params.range.start, lte: params.range.end } }
      : { status: "CANCELLED", cancelledAt: { gte: params.range.start, lte: params.range.end } }
    : {
        OR: [
          {
            status: "COMPLETED",
            completedAt: { gte: params.range.start, lte: params.range.end },
          },
          {
            status: "CANCELLED",
            cancelledAt: { gte: params.range.start, lte: params.range.end },
          },
        ],
      };

  return {
    companyId: params.companyId,
    ...periodFilter,
    ...(params.query.customerId ? { customerId: params.query.customerId } : {}),
    ...(params.query.sellerId ? { sellerId: params.query.sellerId } : {}),
    ...(params.query.paymentMethod
      ? { paymentMethod: params.query.paymentMethod }
      : {}),
    ...(params.query.productId
      ? { items: { some: { productId: params.query.productId } } }
      : {}),
  };
}

export async function findSalesReport(params: {
  companyId: string;
  range: DateRange;
  query: SalesReportQuery;
  take?: number;
  skip?: number;
}) {
  const where = salesPeriodWhere(params);
  const take = params.take ?? params.query.pageSize;
  const skip = params.skip ?? (params.query.page - 1) * params.query.pageSize;
  const [total, items] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: [{ completedAt: "desc" }, { cancelledAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        number: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        discountAmount: true,
        total: true,
        completedAt: true,
        cancelledAt: true,
        customer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            quantity: true,
            lineTotal: true,
            discountAmount: true,
            productName: true,
            productSku: true,
          },
        },
      },
    }),
  ]);

  return {
    ...pageMeta(total, params.query.page, params.query.pageSize),
    items: items.map((sale) => ({
      id: sale.id,
      number: sale.number,
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      subtotal: moneyNumber(sale.subtotal),
      discountAmount: moneyNumber(sale.discountAmount),
      total: moneyNumber(sale.total),
      completedAt: sale.completedAt,
      cancelledAt: sale.cancelledAt,
      customerName: sale.customer?.name ?? null,
      sellerName: sale.seller.name ?? sale.seller.email,
      itemCount: sale.items.length,
      itemQuantity: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      items: sale.items.map((item) => ({
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        discountAmount: moneyNumber(item.discountAmount),
        lineTotal: moneyNumber(item.lineTotal),
      })),
    })),
  };
}

export async function findFinanceReport(params: {
  companyId: string;
  range: DateRange;
  query: FinanceReportQuery;
  take?: number;
  skip?: number;
}) {
  const where: Prisma.AccountReceivableWhereInput = {
    companyId: params.companyId,
    dueDate: { gte: params.range.start, lte: params.range.end },
  };
  if (params.query.status) where.status = params.query.status;
  if (params.query.customerId) where.customerId = params.query.customerId;
  if (params.query.paymentMethod) where.paymentMethod = params.query.paymentMethod;

  const take = params.take ?? params.query.pageSize;
  const skip = params.skip ?? (params.query.page - 1) * params.query.pageSize;
  const [total, items] = await Promise.all([
    prisma.accountReceivable.count({ where }),
    prisma.accountReceivable.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        dueDate: true,
        customer: { select: { name: true } },
        sale: { select: { id: true, number: true, status: true } },
      },
    }),
  ]);

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return {
    ...pageMeta(total, params.query.page, params.query.pageSize),
    items: items.map((item) => {
      const remaining = moneyNumber(item.remainingAmount);
      const dueDate = item.dueDate;
      const overdue =
        remaining > 0 &&
        item.status !== "CANCELLED" &&
        item.status !== "PAID" &&
        dueDate != null &&
        dueDate < startOfToday;
      return {
        id: item.id,
        status: item.status,
        paymentMethod: item.paymentMethod,
        totalAmount: moneyNumber(item.totalAmount),
        paidAmount: moneyNumber(item.paidAmount),
        remainingAmount: remaining,
        dueDate,
        overdue,
        customerName: item.customer?.name ?? null,
        saleId: item.sale.id,
        saleNumber: item.sale.number,
        saleStatus: item.sale.status,
      };
    }),
  };
}

export async function findInventoryReport(params: {
  companyId: string;
  query: InventoryReportQuery;
  take?: number;
  skip?: number;
}) {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p."companyId" = ${params.companyId}`,
    Prisma.sql`p.type = 'PRODUCT'`,
    Prisma.sql`p."deletedAt" IS NULL`,
  ];
  const q = params.query.q?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      Prisma.sql`(p.name ILIKE ${like} OR p.sku ILIKE ${like} OR COALESCE(p.barcode, '') ILIKE ${like})`,
    );
  }
  if (params.query.stock === "out") {
    conditions.push(Prisma.sql`COALESCE(i.quantity, 0) <= 0`);
  } else if (params.query.stock === "low") {
    conditions.push(
      Prisma.sql`COALESCE(i.quantity, 0) > 0
        AND COALESCE(i."minimumQuantity", 0) > 0
        AND i.quantity <= i."minimumQuantity"`,
    );
  }
  const whereSql = Prisma.join(conditions, " AND ");
  const take = params.take ?? params.query.pageSize;
  const skip = params.skip ?? (params.query.page - 1) * params.query.pageSize;

  const [countRows, items] = await Promise.all([
    prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total
      FROM "Product" p
      LEFT JOIN "Inventory" i
        ON i."productId" = p.id AND i."companyId" = p."companyId"
      WHERE ${whereSql}
    `,
    prisma.$queryRaw<
      Array<{
        productId: string;
        name: string;
        sku: string;
        costPrice: unknown;
        quantity: number;
        minimumQuantity: number;
      }>
    >`
      SELECT p.id AS "productId",
             p.name,
             p.sku,
             p."costPrice" AS "costPrice",
             COALESCE(i.quantity, 0)::int AS quantity,
             COALESCE(i."minimumQuantity", 0)::int AS "minimumQuantity"
      FROM "Product" p
      LEFT JOIN "Inventory" i
        ON i."productId" = p.id AND i."companyId" = p."companyId"
      WHERE ${whereSql}
      ORDER BY
        CASE
          WHEN COALESCE(i.quantity, 0) <= 0 THEN 0
          WHEN COALESCE(i."minimumQuantity", 0) > 0 AND i.quantity <= i."minimumQuantity" THEN 1
          ELSE 2
        END,
        p.name ASC
      LIMIT ${take} OFFSET ${skip}
    `,
  ]);

  const total = intNumber(countRows[0]?.total);
  return {
    ...pageMeta(total, params.query.page, params.query.pageSize),
    items: items.map((item) => {
      const quantity = intNumber(item.quantity);
      const minimumQuantity = intNumber(item.minimumQuantity);
      return {
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        costPrice: moneyNumber(item.costPrice),
        quantity,
        minimumQuantity,
        stockLevel: getStockLevel({ quantity, minimumQuantity }),
      };
    }),
  };
}

export async function findPurchasesReport(params: {
  companyId: string;
  range: DateRange;
  query: PurchasesReportQuery;
  take?: number;
  skip?: number;
}) {
  const where: Prisma.PurchaseWhereInput = {
    companyId: params.companyId,
  };
  if (params.query.status) {
    where.status = params.query.status;
    if (params.query.status === "RECEIVED") {
      where.receivedAt = { gte: params.range.start, lte: params.range.end };
    } else if (params.query.status === "CANCELLED") {
      where.cancelledAt = { gte: params.range.start, lte: params.range.end };
    } else {
      where.createdAt = { gte: params.range.start, lte: params.range.end };
    }
  } else {
    where.OR = [
      {
        status: "RECEIVED",
        receivedAt: { gte: params.range.start, lte: params.range.end },
      },
      {
        status: "CANCELLED",
        cancelledAt: { gte: params.range.start, lte: params.range.end },
      },
      {
        status: "DRAFT",
        createdAt: { gte: params.range.start, lte: params.range.end },
      },
    ];
  }
  if (params.query.supplierId) where.supplierId = params.query.supplierId;

  const itemWhere: Prisma.PurchaseItemWhereInput = {
    companyId: params.companyId,
    purchase: where,
    ...(params.query.productId ? { productId: params.query.productId } : {}),
  };
  const take = params.take ?? params.query.pageSize;
  const skip = params.skip ?? (params.query.page - 1) * params.query.pageSize;
  const [total, items] = await Promise.all([
    prisma.purchaseItem.count({ where: itemWhere }),
    prisma.purchaseItem.findMany({
      where: itemWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        quantity: true,
        unitCost: true,
        discountAmount: true,
        lineTotal: true,
        productName: true,
        productSku: true,
        purchase: {
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            receivedAt: true,
            cancelledAt: true,
            createdAt: true,
            supplier: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    ...pageMeta(total, params.query.page, params.query.pageSize),
    items: items.map((item) => ({
      purchaseId: item.purchase.id,
      number: item.purchase.number,
      status: item.purchase.status,
      supplierName: item.purchase.supplier.name,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitCost: moneyNumber(item.unitCost),
      discountAmount: moneyNumber(item.discountAmount),
      lineTotal: moneyNumber(item.lineTotal),
      purchaseTotal: moneyNumber(item.purchase.total),
      receivedAt: item.purchase.receivedAt,
      cancelledAt: item.purchase.cancelledAt,
      createdAt: item.purchase.createdAt,
    })),
  };
}

export async function listReportLookups(companyId: string) {
  const [customers, sellers, products, suppliers] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId, ...notDeletedFilter },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.membership.findMany({
      where: { companyId, user: { deletedAt: null } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ deletedAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
    }),
    prisma.product.findMany({
      where: { companyId, status: "ACTIVE", ...notDeletedFilter },
      select: { id: true, name: true, sku: true, type: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.supplier.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return {
    customers,
    sellers: sellers.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
    })),
    products,
    suppliers,
  };
}
