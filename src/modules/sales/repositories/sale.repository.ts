import type { Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { lockTenantResource } from "@/shared/db/advisory-lock";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type { SaleListQuery } from "@/modules/sales/schemas/sale.schemas";

export type SaleListFilters = SaleListQuery & { companyId: string };

const saleInclude = {
  customer: { select: { id: true, name: true } },
  seller: { select: { id: true, name: true, email: true } },
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      product: { select: { id: true, type: true, status: true } },
    },
  },
  inventoryMovements: {
    orderBy: { createdAt: "desc" as const },
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  },
  accountReceivable: {
    include: {
      installments: {
        orderBy: { number: "asc" as const },
        include: {
          payments: {
            orderBy: { paidAt: "desc" as const },
            include: { paidBy: { select: { name: true, email: true } } },
          },
        },
      },
    },
  },
};

export async function findSales(filters: SaleListFilters) {
  const where: Prisma.SaleWhereInput = {
    companyId: filters.companyId,
  };

  if (filters.status) where.status = filters.status as SaleStatus;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.sellerId) where.sellerId = filters.sellerId;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00.000`);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(`${filters.to}T23:59:59.999`);
    }
  }

  const q = filters.q?.trim();
  if (q) {
    const asNumber = Number.parseInt(q.replace(/\D/g, ""), 10);
    where.OR = [
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { seller: { name: { contains: q, mode: "insensitive" } } },
      { notes: { contains: q, mode: "insensitive" } },
      ...(Number.isFinite(asNumber)
        ? [{ number: asNumber }]
        : []),
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.pageSize,
      include: {
        customer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function findSaleById(params: {
  companyId: string;
  saleId: string;
}) {
  return prisma.sale.findFirst({
    where: { id: params.saleId, companyId: params.companyId },
    include: saleInclude,
  });
}

export async function getSalesKpis(companyId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completed = { status: "COMPLETED" as const };

  const [todayCount, todayAgg, monthCount, monthAgg] = await Promise.all([
    prisma.sale.count({
      where: {
        companyId,
        ...completed,
        completedAt: { gte: startOfToday },
      },
    }),
    prisma.sale.aggregate({
      where: {
        companyId,
        ...completed,
        completedAt: { gte: startOfToday },
      },
      _sum: { total: true },
    }),
    prisma.sale.count({
      where: {
        companyId,
        ...completed,
        completedAt: { gte: startOfMonth },
      },
    }),
    prisma.sale.aggregate({
      where: {
        companyId,
        ...completed,
        completedAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
  ]);

  const todayRevenue = Number(todayAgg._sum.total ?? 0);
  const monthRevenue = Number(monthAgg._sum.total ?? 0);

  const draftAgg = await prisma.sale.aggregate({
    where: { companyId, status: "DRAFT" },
    _sum: { total: true },
  });

  return {
    todayCount,
    todayRevenue,
    monthCount,
    monthRevenue,
    todayTicket: todayCount > 0 ? todayRevenue / todayCount : 0,
    monthTicket: monthCount > 0 ? monthRevenue / monthCount : 0,
    pendingAmount: Number(draftAgg._sum.total ?? 0),
  };
}

export async function nextSaleNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
) {
  await lockTenantResource(tx, "sale-number", companyId);
  const last = await tx.sale.findFirst({
    where: { companyId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export async function listSellableProducts(companyId: string) {
  return prisma.product.findMany({
    where: { companyId, status: "ACTIVE", ...notDeletedFilter },
    orderBy: { name: "asc" },
    take: 300,
    select: {
      id: true,
      name: true,
      sku: true,
      type: true,
      salePrice: true,
      inventory: { select: { quantity: true } },
    },
  });
}

export async function listSaleCustomers(companyId: string) {
  return prisma.customer.findMany({
    where: { companyId, status: "ACTIVE", ...notDeletedFilter },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function listSaleSellers(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId, ...notDeletedFilter },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}
