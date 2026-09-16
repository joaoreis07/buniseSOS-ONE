import {
  Prisma,
  type InventoryMovementType,
  type ProductStatus,
} from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import type {
  InventoryListQuery,
  MovementFormInput,
} from "@/modules/inventory/schemas/inventory.schemas";
import { getStockLevel } from "@/modules/inventory/lib/inventory-labels";

export type InventoryListFilters = InventoryListQuery & { companyId: string };

export async function findPhysicalProduct(params: {
  companyId: string;
  productId: string;
}) {
  return prisma.product.findFirst({
    where: {
      id: params.productId,
      companyId: params.companyId,
      type: "PRODUCT",
      ...notDeletedFilter,
    },
    include: {
      category: { select: { id: true, name: true } },
      inventory: true,
    },
  });
}

export async function listInventoryProducts(filters: InventoryListFilters) {
  const where: Prisma.ProductWhereInput = {
    companyId: filters.companyId,
    type: "PRODUCT",
    ...notDeletedFilter,
  };

  if (filters.status) {
    where.status = filters.status as ProductStatus;
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
    ];
  }

  function toRow<T extends {
    inventory: { id: string; quantity: number; minimumQuantity: number } | null;
  }>(product: T) {
    const quantity = product.inventory?.quantity ?? 0;
    const minimumQuantity = product.inventory?.minimumQuantity ?? 0;
    return {
      product,
      quantity,
      minimumQuantity,
      stockLevel: getStockLevel({ quantity, minimumQuantity }),
      inventoryId: product.inventory?.id ?? null,
    };
  }

  const include = {
    category: { select: { id: true, name: true } },
    inventory: true,
  } as const;

  if (filters.stock === "low") {
    const products = await prisma.product.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      include,
    });
    const rows = products
      .map(toRow)
      .filter((row) => row.stockLevel === "low");
    const total = rows.length;
    const skip = (filters.page - 1) * filters.pageSize;
    const items = rows.slice(skip, skip + filters.pageSize);
    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  }

  if (filters.stock === "out") {
    where.AND = [
      {
        OR: [
          { inventory: { is: null } },
          { inventory: { is: { quantity: { lte: 0 } } } },
        ],
      },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include,
    }),
  ]);

  return {
    items: products.map(toRow),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getInventorySummary(companyId: string) {
  const [row] = await prisma.$queryRaw<
    Array<{
      productCount: number;
      withStock: number;
      lowStock: number;
      outOfStock: number;
      totalQuantity: number;
      totalValue: unknown;
    }>
  >`
    SELECT
      COUNT(*)::int AS "productCount",
      COUNT(i.id)::int AS "withStock",
      COUNT(*) FILTER (
        WHERE COALESCE(i.quantity, 0) > 0
          AND i."minimumQuantity" > 0
          AND COALESCE(i.quantity, 0) <= i."minimumQuantity"
      )::int AS "lowStock",
      COUNT(*) FILTER (WHERE COALESCE(i.quantity, 0) <= 0)::int AS "outOfStock",
      COALESCE(SUM(COALESCE(i.quantity, 0)), 0)::int AS "totalQuantity",
      COALESCE(SUM(COALESCE(i.quantity, 0) * p."costPrice"), 0) AS "totalValue"
    FROM "Product" p
    LEFT JOIN "Inventory" i
      ON i."productId" = p.id AND i."companyId" = p."companyId"
    WHERE p."companyId" = ${companyId}
      AND p.type = 'PRODUCT'
      AND p."deletedAt" IS NULL
  `;

  return {
    productCount: Number(row?.productCount ?? 0),
    withStock: Number(row?.withStock ?? 0),
    lowStock: Number(row?.lowStock ?? 0),
    outOfStock: Number(row?.outOfStock ?? 0),
    totalQuantity: Number(row?.totalQuantity ?? 0),
    totalValue: Number(row?.totalValue ?? 0),
  };
}

export async function ensureInventoryRecord(params: {
  companyId: string;
  productId: string;
}) {
  const existing = await prisma.inventory.findUnique({
    where: { productId: params.productId },
  });
  if (existing) {
    if (existing.companyId !== params.companyId) {
      throw new Error("Produto inválido para esta empresa");
    }
    return existing;
  }

  return prisma.inventory.create({
    data: {
      companyId: params.companyId,
      productId: params.productId,
      quantity: 0,
      minimumQuantity: 0,
    },
  });
}

export async function updateMinimumQuantity(params: {
  companyId: string;
  productId: string;
  minimumQuantity: number;
}) {
  const inventory = await ensureInventoryRecord(params);
  return prisma.inventory.update({
    where: { id: inventory.id },
    data: { minimumQuantity: params.minimumQuantity },
  });
}

function computeNewQuantity(params: {
  type: InventoryMovementType;
  current: number;
  quantity: number;
  targetQuantity?: number;
}) {
  switch (params.type) {
    case "ENTRY":
    case "RETURN":
      return params.current + params.quantity;
    case "EXIT":
    case "LOSS":
      return params.current - params.quantity;
    case "ADJUSTMENT":
      if (params.targetQuantity == null) {
        throw new Error("Quantidade final inválida para ajuste");
      }
      return params.targetQuantity;
    default:
      throw new Error("Tipo de movimentação inválido");
  }
}

export async function applyInventoryMovement(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    productId: string;
    createdById: string;
    type: InventoryMovementType;
    quantity: number;
    targetQuantity?: number;
    reason?: string | null;
    notes?: string | null;
    saleId?: string | null;
    purchaseId?: string | null;
  },
) {
  const product = await tx.product.findFirst({
    where: {
      id: params.productId,
      companyId: params.companyId,
      type: "PRODUCT",
      ...notDeletedFilter,
    },
  });
  if (!product) {
    throw new Error("Produto físico não encontrado neste tenant");
  }

  let inventory = await tx.inventory.findUnique({
    where: { productId: params.productId },
  });
  if (!inventory) {
    try {
      inventory = await tx.inventory.create({
        data: {
          companyId: params.companyId,
          productId: params.productId,
          quantity: 0,
          minimumQuantity: 0,
        },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
      inventory = await tx.inventory.findUnique({
        where: { productId: params.productId },
      });
    }
  }
  if (!inventory || inventory.companyId !== params.companyId) {
    throw new Error("Estoque inválido para esta empresa");
  }

  const locked = await tx.$queryRaw<Array<{ quantity: number }>>`
    SELECT quantity FROM "Inventory"
    WHERE id = ${inventory.id}
      AND "companyId" = ${params.companyId}
    FOR UPDATE
  `;
  if (!locked[0]) {
    throw new Error("Estoque inválido para esta empresa");
  }

  const balanceBefore = locked[0].quantity;
  const balanceAfter = computeNewQuantity({
    type: params.type,
    current: balanceBefore,
    quantity: params.quantity,
    targetQuantity: params.targetQuantity,
  });

  if (balanceAfter < 0) {
    throw new Error("Saldo insuficiente — operação não permitida");
  }

  if (params.type === "ADJUSTMENT") {
    const delta = Math.abs(balanceAfter - balanceBefore);
    if (delta === 0) {
      throw new Error("Ajuste sem alteração de saldo");
    }
  }

  const movementQuantity =
    params.type === "ADJUSTMENT"
      ? Math.abs(balanceAfter - balanceBefore)
      : params.quantity;

  const updated = await tx.inventory.update({
    where: { id: inventory.id },
    data: { quantity: balanceAfter },
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      companyId: params.companyId,
      productId: params.productId,
      type: params.type,
      quantity: movementQuantity,
      reason: params.reason,
      notes:
        params.type === "ADJUSTMENT"
          ? [
              params.notes,
              `Saldo anterior: ${balanceBefore}`,
              `Saldo final: ${balanceAfter}`,
            ]
              .filter(Boolean)
              .join(" · ")
          : params.notes,
      saleId: params.saleId,
      purchaseId: params.purchaseId,
      createdById: params.createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return { inventory: updated, movement, balanceBefore, balanceAfter };
}

export async function registerMovement(params: {
  companyId: string;
  productId: string;
  createdById: string;
  data: MovementFormInput;
}) {
  return prisma.$transaction(async (tx) => {
    const targetQuantity =
      params.data.type === "ADJUSTMENT"
        ? Number(params.data.targetQuantity)
        : undefined;

    return applyInventoryMovement(tx, {
      companyId: params.companyId,
      productId: params.productId,
      createdById: params.createdById,
      type: params.data.type,
      quantity: params.data.quantity,
      targetQuantity,
      reason: params.data.reason,
      notes: params.data.notes,
    });
  });
}

export async function listMovements(params: {
  companyId: string;
  productId: string;
  take?: number;
}) {
  return prisma.inventoryMovement.findMany({
    where: {
      companyId: params.companyId,
      productId: params.productId,
    },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 100,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listTenantCategories(companyId: string) {
  return prisma.productCategory.findMany({
    where: { companyId, ...notDeletedFilter },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
