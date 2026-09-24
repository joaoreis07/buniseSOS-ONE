import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { assertPlanLimit } from "@/modules/billing/services/entitlements.service";
import type {
  ProductFormInput,
  ProductListQuery,
} from "@/modules/products/schemas/product.schemas";
import {
  assertCategoryInTenant,
  createProduct,
  findProductByBarcode,
  findProductById,
  findProductBySku,
  findProducts,
  listTenantCategories,
  softDeleteProduct,
  updateProduct,
} from "@/modules/products/repositories/product.repository";

export function canViewProducts(role: Role): boolean {
  return hasPermission(role, "products:view");
}

export function canManageProducts(role: Role): boolean {
  return hasPermission(role, "products:manage");
}

async function assertProductConstraints(
  companyId: string,
  data: ProductFormInput,
  excludeId?: string,
) {
  if (data.categoryId) {
    const category = await assertCategoryInTenant({
      companyId,
      categoryId: data.categoryId,
    });
    if (!category) {
      throw new Error("Categoria inválida para esta empresa");
    }
  }

  const skuConflict = await findProductBySku({
    companyId,
    sku: data.sku,
    excludeId,
  });
  if (skuConflict) {
    throw new Error("Já existe um produto com este SKU nesta empresa");
  }

  if (data.barcode) {
    const barcodeConflict = await findProductByBarcode({
      companyId,
      barcode: data.barcode,
      excludeId,
    });
    if (barcodeConflict) {
      throw new Error(
        "Já existe um produto com este código de barras nesta empresa",
      );
    }
  }
}

export async function listProductsForTenant(params: {
  companyId: string;
  role: Role;
  query: ProductListQuery;
}) {
  assertPermission(params.role, "products:view");
  return findProducts({ companyId: params.companyId, ...params.query });
}

export async function getProductForTenant(params: {
  companyId: string;
  role: Role;
  productId: string;
}) {
  assertPermission(params.role, "products:view");
  return findProductById({
    companyId: params.companyId,
    productId: params.productId,
  });
}

export async function createProductForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: ProductFormInput;
}) {
  assertPermission(params.role, "products:manage");
  await assertPlanLimit({ companyId: params.companyId, feature: "products" });
  await assertProductConstraints(params.companyId, params.data);
  const product = await createProduct({
    companyId: params.companyId,
    data: params.data,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "products",
    action: "PRODUCT_CREATE",
    entity: "Product",
    entityId: product.id,
    metadata: {
      name: product.name,
      sku: product.sku,
      type: product.type,
      status: product.status,
    },
  });
  return product;
}

export async function updateProductForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  productId: string;
  data: ProductFormInput;
}) {
  assertPermission(params.role, "products:manage");
  await assertProductConstraints(
    params.companyId,
    params.data,
    params.productId,
  );
  const product = await updateProduct({
    companyId: params.companyId,
    productId: params.productId,
    data: params.data,
  });
  if (!product) throw new Error("Produto não encontrado");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "products",
    action: "PRODUCT_UPDATE",
    entity: "Product",
    entityId: product.id,
    metadata: {
      name: product.name,
      sku: product.sku,
      status: product.status,
    },
  });
  return product;
}

export async function deleteProductForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  productId: string;
}) {
  assertPermission(params.role, "products:manage");
  const product = await softDeleteProduct(params);
  if (!product) throw new Error("Produto não encontrado");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "products",
    action: "PRODUCT_DELETE",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku },
  });
  return product;
}

export async function getProductFormMeta(companyId: string) {
  const categories = await listTenantCategories(companyId);
  return { categories };
}
