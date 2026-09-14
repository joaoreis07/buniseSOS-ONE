import { Prisma, type ProductType } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { fromCents, toCents } from "@/modules/finance/lib/money";
import { getStockLevel } from "@/modules/inventory/lib/inventory-labels";
import {
  enumerateBuckets,
  formatChartLabel,
  formatCivilDate,
  type ChartGroup,
  type DateRange,
} from "@/modules/reports/lib/period";
import { intNumber, moneyNumber } from "@/modules/reports/lib/numbers";

type SeriesRow = { bucket: string; count: number; revenue: unknown };

function ticketFrom(count: number, revenue: number): number {
  if (count <= 0) return 0;
  return fromCents(Math.round(toCents(revenue) / count));
}

function fillSeries(
  rows: SeriesRow[],
  range: DateRange,
  group: ChartGroup,
): Array<{ key: string; label: string; count: number; revenue: number }> {
  const byKey = new Map(
    rows.map((row) => [
      row.bucket,
      { count: intNumber(row.count), revenue: moneyNumber(row.revenue) },
    ]),
  );
  return enumerateBuckets(range.start, range.end, group).map((date) => {
    const key = formatCivilDate(date);
    const found = byKey.get(key) ?? { count: 0, revenue: 0 };
    return {
      key,
      label: formatChartLabel(date, group),
      count: found.count,
      revenue: found.revenue,
    };
  });
}

function salesBucketSql(group: ChartGroup) {
  if (group === "week") {
    return Prisma.sql`to_char(date_trunc('week', s."completedAt" AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD')`;
  }
  if (group === "month") {
    return Prisma.sql`to_char(date_trunc('month', s."completedAt" AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD')`;
  }
  return Prisma.sql`to_char(date_trunc('day', s."completedAt" AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD')`;
}

function purchaseBucketSql(group: ChartGroup) {
  if (group === "week") {
    return Prisma.sql`to_char(date_trunc('week', p."receivedAt" AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD')`;
  }
  if (group === "month") {
    return Prisma.sql`to_char(date_trunc('month', p."receivedAt" AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD')`;
  }
  return Prisma.sql`to_char(date_trunc('day', p."receivedAt" AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD')`;
}

export async function aggregateCompletedSales(params: {
  companyId: string;
  start: Date;
  end: Date;
}) {
  const where = {
    companyId: params.companyId,
    status: "COMPLETED" as const,
    completedAt: { gte: params.start, lte: params.end },
  };
  const [count, agg, cancelled] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.aggregate({ where, _sum: { total: true } }),
    prisma.sale.count({
      where: {
        companyId: params.companyId,
        status: "CANCELLED",
        cancelledAt: { gte: params.start, lte: params.end },
      },
    }),
  ]);
  const revenue = moneyNumber(agg._sum.total);
  return {
    count,
    revenue,
    ticket: ticketFrom(count, revenue),
    cancelled,
  };
}

export async function salesChart(params: {
  companyId: string;
  range: DateRange;
}) {
  const bucket = salesBucketSql(params.range.group);
  const rows = await prisma.$queryRaw<SeriesRow[]>`
    SELECT ${bucket} AS bucket,
           COUNT(*)::int AS count,
           COALESCE(SUM(s.total), 0) AS revenue
    FROM "Sale" s
    WHERE s."companyId" = ${params.companyId}
      AND s.status = 'COMPLETED'
      AND s."completedAt" >= ${params.range.start}
      AND s."completedAt" <= ${params.range.end}
    GROUP BY 1
    ORDER BY 1
  `;
  return fillSeries(rows, params.range, params.range.group);
}

export async function salesByProduct(params: {
  companyId: string;
  start: Date;
  end: Date;
  take?: number;
}) {
  const take = params.take ?? 10;
  return prisma.$queryRaw<
    Array<{
      productId: string;
      productName: string;
      productSku: string;
      productType: ProductType;
      quantity: number;
      revenue: unknown;
    }>
  >`
    SELECT si."productId" AS "productId",
           si."productName" AS "productName",
           si."productSku" AS "productSku",
           si."productType" AS "productType",
           SUM(si.quantity)::int AS quantity,
           COALESCE(SUM(si."lineTotal"), 0) AS revenue
    FROM "SaleItem" si
    INNER JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."companyId" = ${params.companyId}
      AND si."companyId" = ${params.companyId}
      AND s.status = 'COMPLETED'
      AND s."completedAt" >= ${params.start}
      AND s."completedAt" <= ${params.end}
    GROUP BY si."productId", si."productName", si."productSku", si."productType"
    ORDER BY SUM(si."lineTotal") DESC, SUM(si.quantity) DESC
    LIMIT ${take}
  `;
}

export async function salesByPaymentMethod(params: {
  companyId: string;
  start: Date;
  end: Date;
}) {
  return prisma.sale.groupBy({
    by: ["paymentMethod"],
    where: {
      companyId: params.companyId,
      status: "COMPLETED",
      completedAt: { gte: params.start, lte: params.end },
    },
    _count: { _all: true },
    _sum: { total: true },
  });
}

export async function financeDashboard(params: {
  companyId: string;
  start: Date;
  end: Date;
}) {
  const startOfToday = new Date(
    params.end.getFullYear(),
    params.end.getMonth(),
    params.end.getDate(),
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  inSevenDays.setHours(23, 59, 59, 999);

  const openWhere = {
    companyId: params.companyId,
    remainingAmount: { gt: 0 },
    status: { notIn: ["PAID" as const, "CANCELLED" as const] },
  };

  const [
    receivedAgg,
    openAgg,
    overdueAgg,
    pendingAgg,
    receivableAgg,
    upcoming,
  ] = await Promise.all([
    prisma.installmentPayment.aggregate({
      where: {
        companyId: params.companyId,
        paidAt: { gte: params.start, lte: params.end },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.installment.aggregate({
      where: openWhere,
      _sum: { remainingAmount: true },
      _count: { _all: true },
    }),
    prisma.installment.aggregate({
      where: {
        ...openWhere,
        dueDate: { lt: today },
      },
      _sum: { remainingAmount: true },
      _count: { _all: true },
    }),
    prisma.installment.aggregate({
      where: {
        ...openWhere,
        dueDate: { gte: today },
      },
      _sum: { remainingAmount: true },
      _count: { _all: true },
    }),
    prisma.accountReceivable.aggregate({
      where: {
        companyId: params.companyId,
        status: { not: "CANCELLED" },
      },
      _sum: { remainingAmount: true, totalAmount: true },
      _count: { _all: true },
    }),
    prisma.installment.findMany({
      where: {
        ...openWhere,
        dueDate: { gte: today, lte: inSevenDays },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: {
        id: true,
        number: true,
        remainingAmount: true,
        dueDate: true,
        accountReceivable: {
          select: {
            sale: { select: { id: true, number: true } },
            customer: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return {
    received: moneyNumber(receivedAgg._sum.amount),
    receivedCount: receivedAgg._count._all,
    open: moneyNumber(openAgg._sum.remainingAmount),
    openCount: openAgg._count._all,
    overdue: moneyNumber(overdueAgg._sum.remainingAmount),
    overdueCount: overdueAgg._count._all,
    pending: moneyNumber(pendingAgg._sum.remainingAmount),
    pendingCount: pendingAgg._count._all,
    receivableTotal: moneyNumber(receivableAgg._sum.totalAmount),
    receivableRemaining: moneyNumber(receivableAgg._sum.remainingAmount),
    receivableCount: receivableAgg._count._all,
    upcoming: upcoming.map((item) => ({
      id: item.id,
      number: item.number,
      remainingAmount: moneyNumber(item.remainingAmount),
      dueDate: item.dueDate,
      saleId: item.accountReceivable.sale.id,
      saleNumber: item.accountReceivable.sale.number,
      customerName: item.accountReceivable.customer?.name ?? null,
    })),
    asOf: startOfToday,
  };
}

export async function inventoryDashboard(companyId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      productCount: number;
      inStock: number;
      outOfStock: number;
      belowMinimum: number;
      estimatedValue: unknown;
    }>
  >`
    SELECT
      COUNT(*)::int AS "productCount",
      COUNT(*) FILTER (
        WHERE COALESCE(i.quantity, 0) > 0
      )::int AS "inStock",
      COUNT(*) FILTER (
        WHERE COALESCE(i.quantity, 0) <= 0
      )::int AS "outOfStock",
      COUNT(*) FILTER (
        WHERE COALESCE(i.quantity, 0) > 0
          AND COALESCE(i."minimumQuantity", 0) > 0
          AND i.quantity <= i."minimumQuantity"
      )::int AS "belowMinimum",
      COALESCE(SUM(COALESCE(i.quantity, 0) * p."costPrice"), 0) AS "estimatedValue"
    FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p.id AND i."companyId" = p."companyId"
    WHERE p."companyId" = ${companyId}
      AND p.type = 'PRODUCT'
      AND p."deletedAt" IS NULL
  `;

  const summary = rows[0] ?? {
    productCount: 0,
    inStock: 0,
    outOfStock: 0,
    belowMinimum: 0,
    estimatedValue: 0,
  };

  const alerts = await prisma.$queryRaw<
    Array<{
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      minimumQuantity: number;
    }>
  >`
    SELECT p.id AS "productId",
           p.name,
           p.sku,
           COALESCE(i.quantity, 0)::int AS quantity,
           COALESCE(i."minimumQuantity", 0)::int AS "minimumQuantity"
    FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p.id AND i."companyId" = p."companyId"
    WHERE p."companyId" = ${companyId}
      AND p.type = 'PRODUCT'
      AND p."deletedAt" IS NULL
      AND (
        COALESCE(i.quantity, 0) <= 0
        OR (
          COALESCE(i."minimumQuantity", 0) > 0
          AND COALESCE(i.quantity, 0) > 0
          AND i.quantity <= i."minimumQuantity"
        )
      )
    ORDER BY
      CASE WHEN COALESCE(i.quantity, 0) <= 0 THEN 0 ELSE 1 END,
      p.name ASC
    LIMIT 8
  `;

  return {
    productCount: intNumber(summary.productCount),
    inStock: intNumber(summary.inStock),
    outOfStock: intNumber(summary.outOfStock),
    belowMinimum: intNumber(summary.belowMinimum),
    estimatedValue: moneyNumber(summary.estimatedValue),
    alerts: alerts.map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      quantity: intNumber(item.quantity),
      minimumQuantity: intNumber(item.minimumQuantity),
      stockLevel: getStockLevel({
        quantity: intNumber(item.quantity),
        minimumQuantity: intNumber(item.minimumQuantity),
      }),
    })),
  };
}

export async function purchasesDashboard(params: {
  companyId: string;
  range: DateRange;
}) {
  const receivedWhere = {
    companyId: params.companyId,
    status: "RECEIVED" as const,
    receivedAt: { gte: params.range.start, lte: params.range.end },
  };
  const bucket = purchaseBucketSql(params.range.group);

  const [
    receivedCount,
    receivedAgg,
    cancelledCount,
    activeSuppliers,
    recent,
    seriesRows,
  ] = await Promise.all([
    prisma.purchase.count({ where: receivedWhere }),
    prisma.purchase.aggregate({
      where: receivedWhere,
      _sum: { total: true },
    }),
    prisma.purchase.count({
      where: {
        companyId: params.companyId,
        status: "CANCELLED",
        cancelledAt: { gte: params.range.start, lte: params.range.end },
      },
    }),
    prisma.supplier.count({
      where: { companyId: params.companyId, status: "ACTIVE" },
    }),
    prisma.purchase.findMany({
      where: receivedWhere,
      orderBy: { receivedAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        total: true,
        receivedAt: true,
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.$queryRaw<SeriesRow[]>`
      SELECT ${bucket} AS bucket,
             COUNT(*)::int AS count,
             COALESCE(SUM(p.total), 0) AS revenue
      FROM "Purchase" p
      WHERE p."companyId" = ${params.companyId}
        AND p.status = 'RECEIVED'
        AND p."receivedAt" >= ${params.range.start}
        AND p."receivedAt" <= ${params.range.end}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  return {
    count: receivedCount,
    value: moneyNumber(receivedAgg._sum.total),
    cancelled: cancelledCount,
    activeSuppliers,
    recent: recent.map((item) => ({
      id: item.id,
      number: item.number,
      total: moneyNumber(item.total),
      receivedAt: item.receivedAt,
      supplierName: item.supplier.name,
    })),
    series: fillSeries(seriesRows, params.range, params.range.group),
  };
}

