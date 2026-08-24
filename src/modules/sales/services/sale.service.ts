import type { Prisma, Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { applyInventoryMovement } from "@/modules/inventory/repositories/inventory.repository";
import type {
  CompleteSaleInput,
  SaleListQuery,
} from "@/modules/sales/schemas/sale.schemas";
import {
  findSaleById,
  findSales,
  getSalesKpis,
  listSaleCustomers,
  listSaleSellers,
  listSellableProducts,
  nextSaleNumber,
} from "@/modules/sales/repositories/sale.repository";
import { computeSaleTotals } from "@/modules/sales/lib/sale-totals";

export function canViewSales(role: Role): boolean {
  return hasPermission(role, "sales:view");
}

export function canCreateSales(role: Role): boolean {
  return (
    hasPermission(role, "sales:create") || hasPermission(role, "sales:manage")
  );
}

export function canCancelSales(role: Role): boolean {
  return (
    hasPermission(role, "sales:cancel") || hasPermission(role, "sales:manage")
  );
}

export async function listSalesForTenant(params: {
  companyId: string;
  role: Role;
  query: SaleListQuery;
}) {
  assertPermission(params.role, "sales:view");
  const [result, kpis, customers, sellers] = await Promise.all([
    findSales({ companyId: params.companyId, ...params.query }),
    getSalesKpis(params.companyId),
    listSaleCustomers(params.companyId),
    listSaleSellers(params.companyId),
  ]);
  return {
    ...result,
    kpis,
    customers,
    sellers: sellers.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
  };
}

export async function getSaleForTenant(params: {
  companyId: string;
  role: Role;
  saleId: string;
}) {
  assertPermission(params.role, "sales:view");
  return findSaleById(params);
}

export async function getSaleFormMeta(companyId: string) {
  const [products, customers] = await Promise.all([
    listSellableProducts(companyId),
    listSaleCustomers(companyId),
  ]);
  return { products, customers };
}

async function loadValidatedSaleItems(
  tx: Prisma.TransactionClient,
  companyId: string,
  items: CompleteSaleInput["items"],
) {
  const uniqueIds = [...new Set(items.map((item) => item.productId))];
  const products = await tx.product.findMany({
    where: {
      id: { in: uniqueIds },
      companyId,
      ...notDeletedFilter,
    },
    include: { inventory: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    qtyByProduct.set(
      item.productId,
      (qtyByProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  return items.map((item, index) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new Error(`Produto inválido para esta empresa (item ${index + 1})`);
    }
    if (product.status !== "ACTIVE") {
      throw new Error(`Produto inativo: ${product.name}`);
    }
    if (product.type === "PRODUCT") {
      const stock = product.inventory?.quantity ?? 0;
      const needed = qtyByProduct.get(item.productId) ?? item.quantity;
      if (needed > stock) {
        throw new Error(
          `Estoque insuficiente para ${product.name} (disponível: ${stock})`,
        );
      }
    }
    return { input: item, product };
  });
}

export async function completeSaleForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: CompleteSaleInput;
}) {
  if (!canCreateSales(params.role)) {
    throw new Error("Você não tem permissão para registrar vendas");
  }

  if (params.data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.data.customerId,
        companyId: params.companyId,
        ...notDeletedFilter,
      },
      select: { id: true },
    });
    if (!customer) {
      throw new Error("Cliente inválido para esta empresa");
    }
  }

  const sale = await prisma.$transaction(async (tx) => {
    const lines = await loadValidatedSaleItems(
      tx,
      params.companyId,
      params.data.items,
    );

    const totals = computeSaleTotals(
      lines.map(({ input, product }) => ({
        quantity: input.quantity,
        unitPrice: Number(product.salePrice),
        discountAmount: input.discountAmount ?? 0,
      })),
      params.data.discountAmount ?? 0,
    );

    const number = await nextSaleNumber(tx, params.companyId);
    const now = new Date();

    const created = await tx.sale.create({
      data: {
        companyId: params.companyId,
        customerId: params.data.customerId,
        sellerId: params.userId,
        number,
        status: "COMPLETED",
        paymentMethod: params.data.paymentMethod,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        total: totals.total,
        notes: params.data.notes,
        completedAt: now,
        items: {
          create: lines.map(({ input, product }, index) => ({
            companyId: params.companyId,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            productType: product.type,
            quantity: input.quantity,
            unitPrice: Number(product.salePrice),
            discountAmount: totals.items[index].discountAmount,
            lineTotal: totals.items[index].lineTotal,
            sortOrder: index,
          })),
        },
      },
    });

    for (const { input, product } of lines) {
      if (product.type !== "PRODUCT") continue;
      await applyInventoryMovement(tx, {
        companyId: params.companyId,
        productId: product.id,
        createdById: params.userId,
        type: "EXIT",
        quantity: input.quantity,
        reason: `Venda ${created.number}`,
        notes: `Saída automática da venda ${created.id}`,
        saleId: created.id,
      });
    }

    return created;
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "sales",
    action: "SALE_COMPLETE",
    entity: "Sale",
    entityId: sale.id,
    metadata: {
      number: sale.number,
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      itemCount: params.data.items.length,
    },
  });

  return sale;
}

export async function cancelSaleForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  saleId: string;
}) {
  if (!canCancelSales(params.role)) {
    throw new Error("Você não tem permissão para cancelar vendas");
  }

  const existing = await findSaleById({
    companyId: params.companyId,
    saleId: params.saleId,
  });
  if (!existing) throw new Error("Venda não encontrada");
  if (existing.status === "CANCELLED") {
    throw new Error("Venda já cancelada");
  }
  if (existing.status !== "COMPLETED") {
    throw new Error("Somente vendas concluídas podem ser canceladas");
  }

  const sale = await prisma.$transaction(async (tx) => {
    const updated = await tx.sale.update({
      where: { id: existing.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    for (const item of existing.items) {
      if (item.productType !== "PRODUCT") continue;
      await applyInventoryMovement(tx, {
        companyId: params.companyId,
        productId: item.productId,
        createdById: params.userId,
        type: "RETURN",
        quantity: item.quantity,
        reason: `Cancelamento venda ${existing.number}`,
        notes: `Devolução automática da venda ${existing.id}`,
        saleId: existing.id,
      });
    }

    return updated;
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "sales",
    action: "SALE_CANCEL",
    entity: "Sale",
    entityId: sale.id,
    metadata: { number: sale.number, total: Number(sale.total) },
  });

  return sale;
}
