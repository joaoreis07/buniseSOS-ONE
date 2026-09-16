import type { Prisma, PurchaseStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { lockTenantResource } from "@/shared/db/advisory-lock";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type { PurchaseListQuery } from "@/modules/purchases/schemas/purchase.schemas";

const purchaseInclude = {
  supplier: { select: { id: true, name: true, tradeName: true, status: true } },
  createdBy: { select: { id: true, name: true, email: true } },
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
};

export async function findPurchases(
  filters: PurchaseListQuery & { companyId: string },
) {
  const where: Prisma.PurchaseWhereInput = { companyId: filters.companyId };
  if (filters.status) where.status = filters.status as PurchaseStatus;
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(`${filters.from}T00:00:00.000`);
    if (filters.to) where.createdAt.lte = new Date(`${filters.to}T23:59:59.999`);
  }
  const q = filters.q?.trim();
  if (q) {
    const asNumber = Number.parseInt(q.replace(/\D/g, ""), 10);
    where.OR = [
      { supplier: { name: { contains: q, mode: "insensitive" } } },
      { notes: { contains: q, mode: "insensitive" } },
      ...(Number.isFinite(asNumber) ? [{ number: asNumber }] : []),
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.pageSize,
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
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

export async function findPurchaseById(params: {
  companyId: string;
  purchaseId: string;
}) {
  return prisma.purchase.findFirst({
    where: { id: params.purchaseId, companyId: params.companyId },
    include: purchaseInclude,
  });
}

export async function getPurchaseKpis(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthWhere = { companyId, createdAt: { gte: startOfMonth } };

  const [monthCount, receivedAgg, receivedCount, cancelledCount] =
    await Promise.all([
      prisma.purchase.count({ where: monthWhere }),
      prisma.purchase.aggregate({
        where: {
          ...monthWhere,
          status: "RECEIVED",
        },
        _sum: { total: true },
      }),
      prisma.purchase.count({
        where: { ...monthWhere, status: "RECEIVED" },
      }),
      prisma.purchase.count({
        where: { ...monthWhere, status: "CANCELLED" },
      }),
    ]);

  return {
    monthCount,
    monthValue: Number(receivedAgg._sum.total ?? 0),
    receivedCount,
    cancelledCount,
  };
}

export async function nextPurchaseNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
) {
  await lockTenantResource(tx, "purchase-number", companyId);
  const last = await tx.purchase.findFirst({
    where: { companyId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export async function listPurchasableProducts(companyId: string) {
  return prisma.product.findMany({
    where: {
      companyId,
      type: "PRODUCT",
      status: "ACTIVE",
      ...notDeletedFilter,
    },
    orderBy: { name: "asc" },
    take: 300,
    select: {
      id: true,
      name: true,
      sku: true,
      type: true,
      costPrice: true,
      inventory: { select: { quantity: true } },
    },
  });
}
