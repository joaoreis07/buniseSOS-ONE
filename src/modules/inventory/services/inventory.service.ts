import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import type {
  InventoryListQuery,
  MinimumQuantityInput,
  MovementFormInput,
} from "@/modules/inventory/schemas/inventory.schemas";
import {
  ensureInventoryRecord,
  findPhysicalProduct,
  getInventorySummary,
  listInventoryProducts,
  listMovements,
  listTenantCategories,
  registerMovement,
  updateMinimumQuantity,
} from "@/modules/inventory/repositories/inventory.repository";
import { notifyStockForProducts } from "@/modules/communications/services/notification.service";

export function canViewInventory(role: Role): boolean {
  return hasPermission(role, "inventory:view");
}

export function canManageInventory(role: Role): boolean {
  return hasPermission(role, "inventory:manage");
}

export function canRegisterMovements(role: Role): boolean {
  return (
    hasPermission(role, "inventory:movements") ||
    hasPermission(role, "inventory:manage")
  );
}

export async function listInventoryForTenant(params: {
  companyId: string;
  role: Role;
  query: InventoryListQuery;
}) {
  assertPermission(params.role, "inventory:view");
  const [result, summary, categories] = await Promise.all([
    listInventoryProducts({ companyId: params.companyId, ...params.query }),
    getInventorySummary(params.companyId),
    listTenantCategories(params.companyId),
  ]);
  return { ...result, summary, categories };
}

export async function getInventoryProductForTenant(params: {
  companyId: string;
  role: Role;
  productId: string;
}) {
  assertPermission(params.role, "inventory:view");
  const product = await findPhysicalProduct(params);
  if (!product) return null;
  return product;
}

export async function getMovementsForTenant(params: {
  companyId: string;
  role: Role;
  productId: string;
}) {
  assertPermission(params.role, "inventory:view");
  const product = await findPhysicalProduct(params);
  if (!product) throw new Error("Produto não encontrado");
  return listMovements(params);
}

export async function initializeInventoryForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  productId: string;
}) {
  assertPermission(params.role, "inventory:manage");
  const product = await findPhysicalProduct(params);
  if (!product) {
    throw new Error("Somente produtos físicos possuem estoque");
  }

  const existing = product.inventory;
  if (existing) return existing;

  const inventory = await ensureInventoryRecord(params);
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "inventory",
    action: "INVENTORY_INIT",
    entity: "Inventory",
    entityId: inventory.id,
    metadata: { productId: params.productId, productName: product.name },
  });
  return inventory;
}

export async function updateMinimumQuantityForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  productId: string;
  data: MinimumQuantityInput;
}) {
  assertPermission(params.role, "inventory:manage");
  const product = await findPhysicalProduct(params);
  if (!product) {
    throw new Error("Somente produtos físicos possuem estoque");
  }

  const inventory = await updateMinimumQuantity({
    companyId: params.companyId,
    productId: params.productId,
    minimumQuantity: params.data.minimumQuantity,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "inventory",
    action: "INVENTORY_MINIMUM_UPDATE",
    entity: "Inventory",
    entityId: inventory.id,
    metadata: {
      productId: params.productId,
      minimumQuantity: inventory.minimumQuantity,
    },
  });

  await notifyStockForProducts({
    companyId: params.companyId,
    actorUserId: params.userId,
    productIds: [params.productId],
  }).catch(() => undefined);

  return inventory;
}

const MOVEMENT_AUDIT_ACTION: Record<
  MovementFormInput["type"],
  string
> = {
  ENTRY: "INVENTORY_ENTRY",
  EXIT: "INVENTORY_EXIT",
  ADJUSTMENT: "INVENTORY_ADJUSTMENT",
  RETURN: "INVENTORY_RETURN",
  LOSS: "INVENTORY_LOSS",
};

export async function registerMovementForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  productId: string;
  data: MovementFormInput;
}) {
  if (!canRegisterMovements(params.role)) {
    throw new Error("Você não tem permissão para registrar movimentações");
  }

  const result = await registerMovement({
    companyId: params.companyId,
    productId: params.productId,
    createdById: params.userId,
    data: params.data,
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "inventory",
    action: MOVEMENT_AUDIT_ACTION[params.data.type],
    entity: "InventoryMovement",
    entityId: result.movement.id,
    metadata: {
      productId: params.productId,
      type: params.data.type,
      quantity: result.movement.quantity,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    },
  });

  await notifyStockForProducts({
    companyId: params.companyId,
    actorUserId: params.userId,
    productIds: [params.productId],
  }).catch(() => undefined);

  return result;
}
