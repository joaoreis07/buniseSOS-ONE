import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type {
  CategoryFormInput,
  CategoryListQuery,
} from "@/modules/products/schemas/category.schemas";

function toCategoryData(input: CategoryFormInput) {
  return {
    name: input.name.trim(),
    description: input.description,
  };
}

export type CategoryListFilters = CategoryListQuery & { companyId: string };

export async function findCategories(filters: CategoryListFilters) {
  const where: Prisma.ProductCategoryWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, items] = await Promise.all([
    prisma.productCategory.count({ where }),
    prisma.productCategory.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include: {
        _count: {
          select: {
            products: { where: notDeletedFilter },
          },
        },
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

export async function findCategoryById(params: {
  companyId: string;
  categoryId: string;
}) {
  return prisma.productCategory.findFirst({
    where: {
      id: params.categoryId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
  });
}

export async function findCategoryByName(params: {
  companyId: string;
  name: string;
  excludeId?: string;
}) {
  return prisma.productCategory.findFirst({
    where: {
      companyId: params.companyId,
      name: { equals: params.name.trim(), mode: "insensitive" },
      ...notDeletedFilter,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function createCategory(params: {
  companyId: string;
  data: CategoryFormInput;
}) {
  return prisma.productCategory.create({
    data: {
      companyId: params.companyId,
      ...toCategoryData(params.data),
    },
  });
}

export async function updateCategory(params: {
  companyId: string;
  categoryId: string;
  data: CategoryFormInput;
}) {
  const existing = await findCategoryById(params);
  if (!existing) return null;
  return prisma.productCategory.update({
    where: { id: existing.id },
    data: toCategoryData(params.data),
  });
}

export async function softDeleteCategory(params: {
  companyId: string;
  categoryId: string;
}) {
  const existing = await findCategoryById(params);
  if (!existing) return null;

  const activeProducts = await prisma.product.count({
    where: {
      companyId: params.companyId,
      categoryId: existing.id,
      ...notDeletedFilter,
    },
  });
  if (activeProducts > 0) {
    throw new Error(
      "Não é possível excluir categoria com produtos vinculados. Remova ou reclassifique os produtos antes.",
    );
  }

  return prisma.productCategory.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}
