import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import type {
  CategoryFormInput,
  CategoryListQuery,
} from "@/modules/products/schemas/category.schemas";
import {
  createCategory,
  findCategories,
  findCategoryById,
  findCategoryByName,
  softDeleteCategory,
  updateCategory,
} from "@/modules/products/repositories/category.repository";

export function canViewCategories(role: Role): boolean {
  return hasPermission(role, "categories:view");
}

export function canManageCategories(role: Role): boolean {
  return hasPermission(role, "categories:manage");
}

async function assertCategoryNameUnique(
  companyId: string,
  name: string,
  excludeId?: string,
) {
  const conflict = await findCategoryByName({
    companyId,
    name,
    excludeId,
  });
  if (conflict) {
    throw new Error("Já existe uma categoria com este nome nesta empresa");
  }
}

export async function listCategoriesForTenant(params: {
  companyId: string;
  role: Role;
  query: CategoryListQuery;
}) {
  assertPermission(params.role, "categories:view");
  return findCategories({ companyId: params.companyId, ...params.query });
}

export async function getCategoryForTenant(params: {
  companyId: string;
  role: Role;
  categoryId: string;
}) {
  assertPermission(params.role, "categories:view");
  return findCategoryById({
    companyId: params.companyId,
    categoryId: params.categoryId,
  });
}

export async function createCategoryForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: CategoryFormInput;
}) {
  assertPermission(params.role, "categories:manage");
  await assertCategoryNameUnique(params.companyId, params.data.name);
  const category = await createCategory({
    companyId: params.companyId,
    data: params.data,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "products",
    action: "CATEGORY_CREATE",
    entity: "ProductCategory",
    entityId: category.id,
    metadata: { name: category.name },
  });
  return category;
}

export async function updateCategoryForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  categoryId: string;
  data: CategoryFormInput;
}) {
  assertPermission(params.role, "categories:manage");
  await assertCategoryNameUnique(
    params.companyId,
    params.data.name,
    params.categoryId,
  );
  const category = await updateCategory({
    companyId: params.companyId,
    categoryId: params.categoryId,
    data: params.data,
  });
  if (!category) throw new Error("Categoria não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "products",
    action: "CATEGORY_UPDATE",
    entity: "ProductCategory",
    entityId: category.id,
    metadata: { name: category.name },
  });
  return category;
}

export async function deleteCategoryForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  categoryId: string;
}) {
  assertPermission(params.role, "categories:manage");
  const category = await softDeleteCategory(params);
  if (!category) throw new Error("Categoria não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "products",
    action: "CATEGORY_DELETE",
    entity: "ProductCategory",
    entityId: category.id,
    metadata: { name: category.name },
  });
  return category;
}
