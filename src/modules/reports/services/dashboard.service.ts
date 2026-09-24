import type { Role } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { toCents } from "@/modules/finance/lib/money";
import { moneyChange, numericChange } from "@/modules/reports/lib/change";
import { moneyNumber } from "@/modules/reports/lib/numbers";
import {
  previousRange,
  resolvePeriod,
  type DateRange,
} from "@/modules/reports/lib/period";
import {
  activeCustomersCount,
  aggregateCompletedSales,
  financeDashboard,
  inventoryDashboard,
  monthlyRevenueExpense,
  pendingActivitiesForDashboard,
  purchasesDashboard,
  salesByCategory,
  salesByPaymentMethod,
  salesByProduct,
  salesChart,
} from "@/modules/reports/repositories/dashboard.repository";
import type { DashboardQuery } from "@/modules/reports/schemas/reports.schemas";

export function canViewDashboard(role: Role) {
  return hasPermission(role, "dashboard:view");
}

export type DashboardSectionFlags = {
  sales: boolean;
  finance: boolean;
  inventory: boolean;
  purchases: boolean;
};

export function dashboardSections(role: Role): DashboardSectionFlags {
  return {
    sales: hasPermission(role, "sales:view"),
    finance: hasPermission(role, "finance:view"),
    inventory: hasPermission(role, "inventory:view"),
    purchases: hasPermission(role, "purchases:view"),
  };
}

export function resolveDashboardPeriod(
  query: DashboardQuery,
  now?: Date,
): DateRange {
  return resolvePeriod({
    preset: query.preset,
    from: query.from,
    to: query.to,
    now,
  });
}

export async function getDashboardForTenant(params: {
  companyId: string;
  role: Role;
  query: DashboardQuery;
  now?: Date;
}) {
  assertPermission(params.role, "dashboard:view");
  const range = resolveDashboardPeriod(params.query, params.now);
  const previous = previousRange(range);
  const sections = dashboardSections(params.role);

  const [
    salesCurrent,
    salesPrevious,
    chart,
    products,
    payments,
    finance,
    inventory,
    purchasesCurrent,
    purchasesPrevious,
    revenueExpense,
    categoryBreakdown,
    activeCustomers,
    pendingActivities,
  ] = await Promise.all([
    sections.sales
      ? aggregateCompletedSales({
          companyId: params.companyId,
          start: range.start,
          end: range.end,
        })
      : null,
    sections.sales
      ? aggregateCompletedSales({
          companyId: params.companyId,
          start: previous.start,
          end: previous.end,
        })
      : null,
    sections.sales ? salesChart({ companyId: params.companyId, range }) : [],
    sections.sales
      ? salesByProduct({
          companyId: params.companyId,
          start: range.start,
          end: range.end,
        })
      : [],
    sections.sales
      ? salesByPaymentMethod({
          companyId: params.companyId,
          start: range.start,
          end: range.end,
        })
      : [],
    sections.finance
      ? financeDashboard({
          companyId: params.companyId,
          start: range.start,
          end: range.end,
        })
      : null,
    sections.inventory ? inventoryDashboard(params.companyId) : null,
    sections.purchases
      ? purchasesDashboard({ companyId: params.companyId, range })
      : null,
    sections.purchases
      ? purchasesDashboard({
          companyId: params.companyId,
          range: { ...range, start: previous.start, end: previous.end },
          totalsOnly: true,
        })
      : null,
    sections.sales || sections.purchases
      ? monthlyRevenueExpense({ companyId: params.companyId })
      : [],
    sections.sales
      ? salesByCategory({
          companyId: params.companyId,
          start: range.start,
          end: range.end,
        })
      : [],
    hasPermission(params.role, "crm:view")
      ? activeCustomersCount(params.companyId)
      : null,
    hasPermission(params.role, "crm:activities:view")
      ? pendingActivitiesForDashboard({ companyId: params.companyId })
      : [],
  ]);

  return {
    range,
    previous,
    sections,
    sales:
      salesCurrent && salesPrevious
        ? {
            count: salesCurrent.count,
            revenue: salesCurrent.revenue,
            ticket: salesCurrent.ticket,
            cancelled: salesCurrent.cancelled,
            countChange: numericChange(salesCurrent.count, salesPrevious.count),
            revenueChange: moneyChange(
              salesCurrent.revenue,
              salesPrevious.revenue,
            ),
            ticketChange: moneyChange(salesCurrent.ticket, salesPrevious.ticket),
          }
        : null,
    chart,
    products: products.map((row) => ({
      productId: row.productId,
      name: row.productName,
      sku: row.productSku,
      type: row.productType,
      quantity: row.quantity,
      revenue: moneyNumber(row.revenue),
    })),
    payments: payments
      .map((row) => ({
        paymentMethod: row.paymentMethod,
        count: row._count._all,
        revenue: moneyNumber(row._sum.total),
      }))
      .sort((a, b) => toCents(b.revenue) - toCents(a.revenue)),
    finance,
    inventory,
    purchases: purchasesCurrent
      ? {
          ...purchasesCurrent,
          countChange: numericChange(
            purchasesCurrent.count,
            purchasesPrevious?.count ?? 0,
          ),
          valueChange: moneyChange(
            purchasesCurrent.value,
            purchasesPrevious?.value ?? 0,
          ),
        }
      : null,
    revenueExpense,
    categoryBreakdown,
    activeCustomers,
    pendingActivities,
  };
}
