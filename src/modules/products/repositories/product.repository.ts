import type { Prisma, ProductStatus, ProductType } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type {
  ProductFormInput,
  ProductListQuery,
} from "@/modules/products/schemas/product.schemas";

function toProductData(input: ProductFormInput) {
  return {
    name: input.name.trim(),
    sku: input.sku.trim().toUpperCase(),
    barcode: input.barcode?.trim() || null,
    description: input.description,
    type: input.type,
    categoryId: input.categoryId,
    costPrice: input.costPrice,
    salePrice: input.salePrice,
    status: input.status,
    imageUrl: input.imageUrl,
  };
}

export type ProductListFilters = ProductListQuery & { companyId: string };

export async function findProducts(filters: ProductListFilters) {
  const where: Prisma.ProductWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  if (filters.type) where.type = filters.type as ProductType;
  if (filters.status) where.status = filters.status as ProductStatus;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.sku) {
    where.sku = { contains: filters.sku.trim(), mode: "insensitive" };
  }
  if (filters.barcode) {
    where.barcode = { contains: filters.barcode.trim(), mode: "insensitive" };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include: {
        category: { select: { id: true, name: true } },
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

export async function findProductById(params: {
  companyId: string;
  productId: string;
}) {
  return prisma.product.findFirst({
    where: {
      id: params.productId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });
}

export async function findProductBySku(params: {
  companyId: string;
  sku: string;
  excludeId?: string;
}) {
  return prisma.product.findFirst({
    where: {
      companyId: params.companyId,
      sku: params.sku.trim().toUpperCase(),
      ...notDeletedFilter,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function findProductByBarcode(params: {
  companyId: string;
  barcode: string;
  excludeId?: string;
}) {
  return prisma.product.findFirst({
    where: {
      companyId: params.companyId,
      barcode: params.barcode.trim(),
      ...notDeletedFilter,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function createProduct(params: {
  companyId: string;
  data: ProductFormInput;
}) {
  return prisma.product.create({
    data: {
      companyId: params.companyId,
      ...toProductData(params.data),
    },
  });
}

export async function updateProduct(params: {
  companyId: string;
  productId: string;
  data: ProductFormInput;
}) {
  const existing = await findProductById(params);
  if (!existing) return null;
  return prisma.product.update({
    where: { id: existing.id },
    data: toProductData(params.data),
  });
}

export async function softDeleteProduct(params: {
  companyId: string;
  productId: string;
}) {
  const existing = await findProductById(params);
  if (!existing) return null;
  return prisma.product.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}

export async function listTenantCategories(companyId: string) {
  return prisma.productCategory.findMany({
    where: { companyId, ...notDeletedFilter },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function assertCategoryInTenant(params: {
  companyId: string;
  categoryId: string;
}) {
  return prisma.productCategory.findFirst({
    where: {
      id: params.categoryId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    select: { id: true },
  });
}
