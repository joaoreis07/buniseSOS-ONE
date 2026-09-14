import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { formatDateBR, RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  PURCHASE_STATUS_LABELS,
  formatPurchaseNumber,
} from "@/modules/purchases/lib/purchase-labels";
import { STOCK_LEVEL_LABELS } from "@/modules/inventory/lib/inventory-labels";
import { csvFilename, toCsv } from "@/modules/reports/lib/csv";
import { resolvePeriod, type DateRange } from "@/modules/reports/lib/period";
import {
  REPORT_EXPORT_LIMIT,
  findFinanceReport,
  findInventoryReport,
  findPurchasesReport,
  findSalesReport,
  listReportLookups,
} from "@/modules/reports/repositories/reports.repository";
import type {
  FinanceReportQuery,
  InventoryReportQuery,
  PurchasesReportQuery,
  ReportType,
  SalesReportQuery,
} from "@/modules/reports/schemas/reports.schemas";

function formatCsvMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function requireReportAccess(role: Role, type: ReportType) {
  assertPermission(role, "reports:view");
  if (type === "sales") assertPermission(role, "sales:view");
  if (type === "finance") assertPermission(role, "finance:view");
  if (type === "inventory") assertPermission(role, "inventory:view");
  if (type === "purchases") assertPermission(role, "purchases:view");
}

export function canViewReports(role: Role) {
  return hasPermission(role, "reports:view");
}

export function availableReports(role: Role): ReportType[] {
  if (!canViewReports(role)) return [];
  const types: ReportType[] = [];
  if (hasPermission(role, "sales:view")) types.push("sales");
  if (hasPermission(role, "finance:view")) types.push("finance");
  if (hasPermission(role, "inventory:view")) types.push("inventory");
  if (hasPermission(role, "purchases:view")) types.push("purchases");
  return types;
}

export function resolveReportPeriod(
  query: { preset?: string | null; from?: string | null; to?: string | null },
  now?: Date,
): DateRange {
  return resolvePeriod({
    preset: query.preset,
    from: query.from,
    to: query.to,
    now,
  });
}

export async function getSalesReportForTenant(params: {
  companyId: string;
  role: Role;
  query: SalesReportQuery;
  now?: Date;
}) {
  requireReportAccess(params.role, "sales");
  const range = resolveReportPeriod(params.query, params.now);
  const [result, lookups] = await Promise.all([
    findSalesReport({
      companyId: params.companyId,
      range,
      query: params.query,
    }),
    listReportLookups(params.companyId),
  ]);
  return { ...result, range, lookups };
}

export async function getFinanceReportForTenant(params: {
  companyId: string;
  role: Role;
  query: FinanceReportQuery;
  now?: Date;
}) {
  requireReportAccess(params.role, "finance");
  const range = resolveReportPeriod(params.query, params.now);
  const [result, lookups] = await Promise.all([
    findFinanceReport({
      companyId: params.companyId,
      range,
      query: params.query,
    }),
    listReportLookups(params.companyId),
  ]);
  return { ...result, range, lookups };
}

export async function getInventoryReportForTenant(params: {
  companyId: string;
  role: Role;
  query: InventoryReportQuery;
}) {
  requireReportAccess(params.role, "inventory");
  const [result, lookups] = await Promise.all([
    findInventoryReport({
      companyId: params.companyId,
      query: params.query,
    }),
    listReportLookups(params.companyId),
  ]);
  return { ...result, lookups };
}

export async function getPurchasesReportForTenant(params: {
  companyId: string;
  role: Role;
  query: PurchasesReportQuery;
  now?: Date;
}) {
  requireReportAccess(params.role, "purchases");
  const range = resolveReportPeriod(params.query, params.now);
  const [result, lookups] = await Promise.all([
    findPurchasesReport({
      companyId: params.companyId,
      range,
      query: params.query,
    }),
    listReportLookups(params.companyId),
  ]);
  return { ...result, range, lookups };
}

export async function exportReportCsv(params: {
  companyId: string;
  userId: string;
  role: Role;
  type: ReportType;
  query:
    | SalesReportQuery
    | FinanceReportQuery
    | InventoryReportQuery
    | PurchasesReportQuery;
  now?: Date;
}) {
  requireReportAccess(params.role, params.type);

  let filename: string;
  let csv: string;

  if (params.type === "sales") {
    const query = params.query as SalesReportQuery;
    const range = resolveReportPeriod(query, params.now);
    const result = await findSalesReport({
      companyId: params.companyId,
      range,
      query,
      skip: 0,
      take: REPORT_EXPORT_LIMIT,
    });
    csv = toCsv(
      [
        "Número",
        "Status",
        "Data",
        "Cliente",
        "Vendedor",
        "Forma de pagamento",
        "Itens",
        "Quantidade",
        "Subtotal",
        "Descontos",
        "Total",
      ],
      result.items.map((row) => [
        formatSaleNumber(row.number),
        SALE_STATUS_LABELS[row.status as keyof typeof SALE_STATUS_LABELS] ??
          row.status,
        formatDateBR(row.completedAt ?? row.cancelledAt),
        row.customerName ?? "",
        row.sellerName,
        PAYMENT_METHOD_LABELS[row.paymentMethod],
        row.itemCount,
        row.itemQuantity,
        formatCsvMoney(row.subtotal),
        formatCsvMoney(row.discountAmount),
        formatCsvMoney(row.total),
      ]),
    );
    filename = csvFilename("relatorio-vendas");
  } else if (params.type === "finance") {
    const query = params.query as FinanceReportQuery;
    const range = resolveReportPeriod(query, params.now);
    const result = await findFinanceReport({
      companyId: params.companyId,
      range,
      query,
      skip: 0,
      take: REPORT_EXPORT_LIMIT,
    });
    csv = toCsv(
      [
        "Venda",
        "Cliente",
        "Status",
        "Forma de pagamento",
        "Vencimento",
        "Valor original",
        "Recebido",
        "Saldo",
        "Vencido",
      ],
      result.items.map((row) => [
        formatSaleNumber(row.saleNumber),
        row.customerName ?? "",
        RECEIVABLE_STATUS_LABELS[row.status],
        PAYMENT_METHOD_LABELS[row.paymentMethod],
        formatDateBR(row.dueDate),
        formatCsvMoney(row.totalAmount),
        formatCsvMoney(row.paidAmount),
        formatCsvMoney(row.remainingAmount),
        row.overdue ? "Sim" : "Não",
      ]),
    );
    filename = csvFilename("relatorio-financeiro");
  } else if (params.type === "inventory") {
    const query = params.query as InventoryReportQuery;
    const result = await findInventoryReport({
      companyId: params.companyId,
      query,
      skip: 0,
      take: REPORT_EXPORT_LIMIT,
    });
    csv = toCsv(
      ["Produto", "SKU", "Estoque", "Mínimo", "Status", "Custo"],
      result.items.map((row) => [
        row.name,
        row.sku,
        row.quantity,
        row.minimumQuantity,
        STOCK_LEVEL_LABELS[row.stockLevel],
        formatCsvMoney(row.costPrice),
      ]),
    );
    filename = csvFilename("relatorio-estoque");
  } else {
    const query = params.query as PurchasesReportQuery;
    const range = resolveReportPeriod(query, params.now);
    const result = await findPurchasesReport({
      companyId: params.companyId,
      range,
      query,
      skip: 0,
      take: REPORT_EXPORT_LIMIT,
    });
    csv = toCsv(
      [
        "Compra",
        "Status",
        "Fornecedor",
        "Produto",
        "SKU",
        "Quantidade",
        "Custo unitário",
        "Total do item",
        "Total da compra",
      ],
      result.items.map((row) => [
        formatPurchaseNumber(row.number),
        PURCHASE_STATUS_LABELS[row.status],
        row.supplierName,
        row.productName,
        row.productSku,
        row.quantity,
        formatCsvMoney(row.unitCost),
        formatCsvMoney(row.lineTotal),
        formatCsvMoney(row.purchaseTotal),
      ]),
    );
    filename = csvFilename("relatorio-compras");
  }

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "reports",
    action: "REPORT_EXPORTED",
    entity: "Report",
    entityId: params.type,
    metadata: { type: params.type, filename },
  });

  return { filename, csv };
}
