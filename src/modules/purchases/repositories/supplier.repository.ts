import type { Prisma, SupplierStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type {
  SupplierFormInput,
  SupplierListQuery,
} from "@/modules/purchases/schemas/supplier.schemas";

export async function findSuppliers(
  filters: SupplierListQuery & { companyId: string },
) {
  const where: Prisma.SupplierWhereInput = { companyId: filters.companyId };
  if (filters.status) where.status = filters.status as SupplierStatus;
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tradeName: { contains: q, mode: "insensitive" } },
      { document: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: filters.pageSize,
      include: {
        _count: { select: { purchases: true } },
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

export async function findSupplierById(params: {
  companyId: string;
  supplierId: string;
}) {
  return prisma.supplier.findFirst({
    where: { id: params.supplierId, companyId: params.companyId },
    include: {
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          createdAt: true,
          receivedAt: true,
        },
      },
    },
  });
}

export async function getSupplierMetrics(params: {
  companyId: string;
  supplierId: string;
}) {
  const [agg, last] = await Promise.all([
    prisma.purchase.aggregate({
      where: {
        companyId: params.companyId,
        supplierId: params.supplierId,
        status: "RECEIVED",
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.purchase.findFirst({
      where: {
        companyId: params.companyId,
        supplierId: params.supplierId,
        status: "RECEIVED",
      },
      orderBy: { receivedAt: "desc" },
      select: { id: true, number: true, receivedAt: true, total: true },
    }),
  ]);

  return {
    receivedCount: agg._count._all,
    totalPurchased: agg._sum.total ?? 0,
    lastPurchase: last,
  };
}

export async function createSupplier(params: {
  companyId: string;
  data: SupplierFormInput;
}) {
  return prisma.supplier.create({
    data: {
      companyId: params.companyId,
      ...params.data,
    },
  });
}

export async function updateSupplier(params: {
  companyId: string;
  supplierId: string;
  data: SupplierFormInput;
}) {
  const existing = await prisma.supplier.findFirst({
    where: { id: params.supplierId, companyId: params.companyId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.supplier.update({
    where: { id: existing.id },
    data: params.data,
  });
}

export async function listActiveSuppliers(companyId: string) {
  return prisma.supplier.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true, name: true, tradeName: true },
    orderBy: { name: "asc" },
    take: 300,
  });
}

export async function listSuppliersLite(companyId: string) {
  return prisma.supplier.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 300,
  });
}
