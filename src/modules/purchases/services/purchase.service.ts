import type { Prisma, Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { applyInventoryMovement } from "@/modules/inventory/repositories/inventory.repository";
import { computeSaleTotals } from "@/modules/sales/lib/sale-totals";
import type {
  PurchaseFormInput,
  PurchaseListQuery,
} from "@/modules/purchases/schemas/purchase.schemas";
import {
  findPurchaseById,
  findPurchases,
  getPurchaseKpis,
  listPurchasableProducts,
  nextPurchaseNumber,
} from "@/modules/purchases/repositories/purchase.repository";
import { listActiveSuppliers, listSuppliersLite } from "@/modules/purchases/repositories/supplier.repository";

export function canViewPurchases(role: Role) {
  return hasPermission(role, "purchases:view");
}

export function canCreatePurchases(role: Role) {
  return (
    hasPermission(role, "purchases:create") ||
    hasPermission(role, "purchases:manage")
  );
}

export function canReceivePurchases(role: Role) {
  return (
    hasPermission(role, "purchases:receive") ||
    hasPermission(role, "purchases:manage")
  );
}

export function canCancelPurchases(role: Role) {
  return (
    hasPermission(role, "purchases:cancel") ||
    hasPermission(role, "purchases:manage")
  );
}

export async function listPurchasesForTenant(params: {
  companyId: string;
  role: Role;
  query: PurchaseListQuery;
}) {
  assertPermission(params.role, "purchases:view");
  const [result, kpis, suppliers] = await Promise.all([
    findPurchases({ companyId: params.companyId, ...params.query }),
    getPurchaseKpis(params.companyId),
    listSuppliersLite(params.companyId),
  ]);
  return { ...result, kpis, suppliers };
}

export async function getPurchaseForTenant(params: {
  companyId: string;
  role: Role;
  purchaseId: string;
}) {
  assertPermission(params.role, "purchases:view");
  return findPurchaseById(params);
}

export async function getPurchaseFormMeta(companyId: string) {
  const [products, suppliers] = await Promise.all([
    listPurchasableProducts(companyId),
    listActiveSuppliers(companyId),
  ]);
  return { products, suppliers };
}

async function loadValidatedPurchaseItems(
  tx: Prisma.TransactionClient,
  companyId: string,
  items: PurchaseFormInput["items"],
) {
  const uniqueIds = [...new Set(items.map((item) => item.productId))];
  const products = await tx.product.findMany({
    where: {
      id: { in: uniqueIds },
      companyId,
      ...notDeletedFilter,
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  return items.map((item, index) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new Error(`Produto inválido para esta empresa (item ${index + 1})`);
    }
    if (product.status !== "ACTIVE") {
      throw new Error(`Produto inativo: ${product.name}`);
    }
    if (product.type !== "PRODUCT") {
      throw new Error(
        `Somente produtos físicos podem ser comprados (${product.name})`,
      );
    }
    return { input: item, product };
  });
}

async function assertSupplierForPurchase(
  tx: Prisma.TransactionClient,
  params: { companyId: string; supplierId: string },
) {
  const supplier = await tx.supplier.findFirst({
    where: { id: params.supplierId, companyId: params.companyId },
  });
  if (!supplier) throw new Error("Fornecedor inválido para esta empresa");
  if (supplier.status !== "ACTIVE") {
    throw new Error("Fornecedor inativo");
  }
  return supplier;
}

export async function createPurchaseForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: PurchaseFormInput;
  receive?: boolean;
}) {
  if (params.receive) {
    if (!canReceivePurchases(params.role) || !canCreatePurchases(params.role)) {
      throw new Error("Você não tem permissão para receber compras");
    }
  } else if (!canCreatePurchases(params.role)) {
    throw new Error("Você não tem permissão para registrar compras");
  }

  const purchase = await prisma.$transaction(async (tx) => {
    await assertSupplierForPurchase(tx, {
      companyId: params.companyId,
      supplierId: params.data.supplierId,
    });
    const lines = await loadValidatedPurchaseItems(
      tx,
      params.companyId,
      params.data.items,
    );
    const totals = computeSaleTotals(
      lines.map(({ input }) => ({
        quantity: input.quantity,
        unitPrice: input.unitCost,
        discountAmount: input.discountAmount ?? 0,
      })),
      params.data.discountAmount ?? 0,
    );
    const number = await nextPurchaseNumber(tx, params.companyId);
    const created = await tx.purchase.create({
      data: {
        companyId: params.companyId,
        supplierId: params.data.supplierId,
        createdById: params.userId,
        number,
        status: "DRAFT",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        total: totals.total,
        notes: params.data.notes,
        items: {
          create: lines.map(({ input, product }, index) => ({
            companyId: params.companyId,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            productType: product.type,
            quantity: input.quantity,
            unitCost: totals.items[index].unitPrice,
            discountAmount: totals.items[index].discountAmount,
            lineTotal: totals.items[index].lineTotal,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    });

    if (params.receive) {
      return receiveLockedPurchase(tx, {
        companyId: params.companyId,
        userId: params.userId,
        purchaseId: created.id,
      });
    }
    return created;
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "purchases",
    action: "PURCHASE_CREATED",
    entity: "Purchase",
    entityId: purchase.id,
    metadata: {
      number: purchase.number,
      total: Number(purchase.total),
      itemCount: params.data.items.length,
    },
  });
  if (purchase.status === "RECEIVED") {
    await writeAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      module: "purchases",
      action: "PURCHASE_RECEIVED",
      entity: "Purchase",
      entityId: purchase.id,
      metadata: { number: purchase.number },
    });
  }
  return purchase;
}

export async function updateDraftPurchaseForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  purchaseId: string;
  data: PurchaseFormInput;
}) {
  if (!canCreatePurchases(params.role)) {
    throw new Error("Você não tem permissão para editar compras");
  }

  const purchase = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM "Purchase"
      WHERE id = ${params.purchaseId} AND "companyId" = ${params.companyId}
      FOR UPDATE
    `;
    const existing = await tx.purchase.findFirst({
      where: { id: params.purchaseId, companyId: params.companyId },
    });
    if (!existing) throw new Error("Compra não encontrada");
    if (existing.status !== "DRAFT") {
      throw new Error("Somente rascunhos podem ser editados");
    }
    await assertSupplierForPurchase(tx, {
      companyId: params.companyId,
      supplierId: params.data.supplierId,
    });
    const lines = await loadValidatedPurchaseItems(
      tx,
      params.companyId,
      params.data.items,
    );
    const totals = computeSaleTotals(
      lines.map(({ input }) => ({
        quantity: input.quantity,
        unitPrice: input.unitCost,
        discountAmount: input.discountAmount ?? 0,
      })),
      params.data.discountAmount ?? 0,
    );
    await tx.purchaseItem.deleteMany({
      where: { purchaseId: existing.id, companyId: params.companyId },
    });
    return tx.purchase.update({
      where: { id: existing.id },
      data: {
        supplierId: params.data.supplierId,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        total: totals.total,
        notes: params.data.notes,
        items: {
          create: lines.map(({ input, product }, index) => ({
            companyId: params.companyId,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            productType: product.type,
            quantity: input.quantity,
            unitCost: totals.items[index].unitPrice,
            discountAmount: totals.items[index].discountAmount,
            lineTotal: totals.items[index].lineTotal,
            sortOrder: index,
          })),
        },
      },
    });
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "purchases",
    action: "PURCHASE_UPDATED",
    entity: "Purchase",
    entityId: purchase.id,
    metadata: { number: purchase.number },
  });
  return purchase;
}

async function receiveLockedPurchase(
  tx: Prisma.TransactionClient,
  params: { companyId: string; userId: string; purchaseId: string },
) {
  await tx.$queryRaw`
    SELECT id FROM "Purchase"
    WHERE id = ${params.purchaseId} AND "companyId" = ${params.companyId}
    FOR UPDATE
  `;
  const purchase = await tx.purchase.findFirst({
    where: { id: params.purchaseId, companyId: params.companyId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!purchase) throw new Error("Compra não encontrada");
  if (purchase.status === "RECEIVED") {
    throw new Error("Compra já recebida");
  }
  if (purchase.status === "CANCELLED") {
    throw new Error("Compra cancelada não pode ser recebida");
  }
  if (purchase.status !== "DRAFT") {
    throw new Error("Somente rascunhos podem ser recebidos");
  }
  if (purchase.items.length === 0) {
    throw new Error("Compra sem itens");
  }

  for (const item of purchase.items) {
    if (item.productType !== "PRODUCT") {
      throw new Error(`Item inválido para estoque: ${item.productName}`);
    }
    await applyInventoryMovement(tx, {
      companyId: params.companyId,
      productId: item.productId,
      createdById: params.userId,
      type: "ENTRY",
      quantity: item.quantity,
      reason: `Compra ${purchase.number}`,
      notes: `Entrada automática da compra ${purchase.id}`,
      purchaseId: purchase.id,
    });
    await tx.product.update({
      where: { id: item.productId },
      data: { costPrice: item.unitCost },
    });
  }

  return tx.purchase.update({
    where: { id: purchase.id },
    data: { status: "RECEIVED", receivedAt: new Date() },
    include: { items: true },
  });
}

export async function receivePurchaseForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  purchaseId: string;
}) {
  if (!canReceivePurchases(params.role)) {
    throw new Error("Você não tem permissão para receber compras");
  }

  const purchase = await prisma.$transaction(async (tx) =>
    receiveLockedPurchase(tx, {
      companyId: params.companyId,
      userId: params.userId,
      purchaseId: params.purchaseId,
    }),
  );

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "purchases",
    action: "PURCHASE_RECEIVED",
    entity: "Purchase",
    entityId: purchase.id,
    metadata: { number: purchase.number, total: Number(purchase.total) },
  });
  return purchase;
}

export async function cancelPurchaseForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  purchaseId: string;
}) {
  if (!canCancelPurchases(params.role)) {
    throw new Error("Você não tem permissão para cancelar compras");
  }

  const purchase = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM "Purchase"
      WHERE id = ${params.purchaseId} AND "companyId" = ${params.companyId}
      FOR UPDATE
    `;
    const existing = await tx.purchase.findFirst({
      where: { id: params.purchaseId, companyId: params.companyId },
      include: { items: true },
    });
    if (!existing) throw new Error("Compra não encontrada");
    if (existing.status === "CANCELLED") {
      throw new Error("Compra já cancelada");
    }

    if (existing.status === "RECEIVED") {
      for (const item of existing.items) {
        if (item.productType !== "PRODUCT") continue;
        await applyInventoryMovement(tx, {
          companyId: params.companyId,
          productId: item.productId,
          createdById: params.userId,
          type: "EXIT",
          quantity: item.quantity,
          reason: `Cancelamento compra ${existing.number}`,
          notes: `Estorno automático da compra ${existing.id}`,
          purchaseId: existing.id,
        });
      }
    }

    return tx.purchase.update({
      where: { id: existing.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "purchases",
    action: "PURCHASE_CANCELLED",
    entity: "Purchase",
    entityId: purchase.id,
    metadata: {
      number: purchase.number,
      total: Number(purchase.total),
    },
  });
  return purchase;
}
