import { Prisma, type CustomerStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { fromCents, toCents } from "@/modules/finance/lib/money";
import type {
  CustomerFormInput,
  CustomerListQuery,
} from "@/modules/crm/schemas/customer.schemas";
import {
  digitsOnly,
  phoneKey,
} from "@/modules/crm/lib/customer-normalize";

function toCustomerData(
  input: CustomerFormInput,
): Prisma.CustomerUncheckedCreateInput {
  return {
    companyId: "",
    type: input.type,
    name: input.name.trim(),
    tradeName: input.tradeName,
    document: digitsOnly(input.document),
    email: input.email?.toLowerCase() ?? null,
    phone: digitsOnly(input.phone),
    mobile: digitsOnly(input.mobile),
    whatsapp: digitsOnly(input.whatsapp),
    zipCode: digitsOnly(input.zipCode),
    street: input.street,
    number: input.number,
    complement: input.complement,
    district: input.district,
    city: input.city,
    state: input.state?.toUpperCase() ?? null,
    country: input.country || "BR",
    status: input.status,
    origin: input.origin,
    notes: input.notes,
    ownerId: input.ownerId,
  };
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export type CustomerListFilters = CustomerListQuery & {
  companyId: string;
};

export type CustomerListMetrics = {
  salesCount: number;
  salesTotal: number;
  lastSaleAt: Date | null;
  openBalance: number;
};

function customerWhere(filters: CustomerListFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {
    companyId: filters.companyId,
    ...notDeletedFilter,
  };

  if (filters.status) {
    where.status = filters.status as CustomerStatus;
  }
  if (filters.origin) {
    where.origin = { equals: filters.origin, mode: "insensitive" };
  }
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt.gte = new Date(`${filters.createdFrom}T00:00:00.000`);
    }
    if (filters.createdTo) {
      where.createdAt.lte = new Date(`${filters.createdTo}T23:59:59.999`);
    }
  }

  const q = filters.q?.trim();
  if (q) {
    const qDigits = q.replace(/\D/g, "");
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tradeName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
      ...(qDigits.length > 0 ? [{ document: { contains: qDigits } }] : []),
    ];
  }

  if (filters.commerce === "with_sales") {
    where.sales = { some: { status: "COMPLETED" } };
  } else if (filters.commerce === "without_sales") {
    where.sales = { none: { status: "COMPLETED" } };
  }

  if (filters.balance === "open") {
    where.accountReceivables = {
      some: {
        remainingAmount: { gt: 0 },
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      },
    };
  } else if (filters.balance === "overdue") {
    where.accountReceivables = {
      some: {
        installments: {
          some: {
            remainingAmount: { gt: 0 },
            status: { notIn: ["PAID", "CANCELLED"] },
            dueDate: { lt: startOfToday() },
          },
        },
      },
    };
  }

  return where;
}

export async function findDuplicateCustomer(params: {
  companyId: string;
  data: CustomerFormInput;
  excludeId?: string;
}) {
  const document = digitsOnly(params.data.document);
  const email = params.data.email?.toLowerCase() ?? null;
  const phones = [
    phoneKey(params.data.phone),
    phoneKey(params.data.mobile),
    phoneKey(params.data.whatsapp),
  ].filter((value, index, list): value is string => {
    return Boolean(value) && list.indexOf(value) === index;
  });

  if (!document && !email && phones.length === 0) {
    return null;
  }

  const or: Prisma.CustomerWhereInput[] = [];
  if (document) or.push({ document });
  if (email) or.push({ email });
  for (const phone of phones) {
    or.push({ phone });
    or.push({ mobile: phone });
    or.push({ whatsapp: phone });
  }

  const found = await prisma.customer.findFirst({
    where: {
      companyId: params.companyId,
      ...notDeletedFilter,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      OR: or,
    },
    select: {
      id: true,
      name: true,
      document: true,
      email: true,
      phone: true,
      mobile: true,
      whatsapp: true,
    },
  });

  if (!found && phones.length > 0) {
    const phoneMatch = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        document: string | null;
        email: string | null;
        phone: string | null;
        mobile: string | null;
        whatsapp: string | null;
      }>
    >`
      SELECT id, name, document, email, phone, mobile, whatsapp
      FROM "Customer"
      WHERE "companyId" = ${params.companyId}
        AND "deletedAt" IS NULL
        ${params.excludeId ? Prisma.sql`AND id <> ${params.excludeId}` : Prisma.empty}
        AND (
          regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') IN (${Prisma.join(phones)})
          OR regexp_replace(COALESCE(mobile, ''), '[^0-9]', '', 'g') IN (${Prisma.join(phones)})
          OR regexp_replace(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') IN (${Prisma.join(phones)})
        )
      LIMIT 1
    `;
    if (phoneMatch[0]) {
      return { customer: phoneMatch[0], field: "phone" as const };
    }
  }

  if (!found) return null;

  if (document && found.document === document) {
    return { customer: found, field: "document" as const };
  }
  if (email && found.email === email) {
    return { customer: found, field: "email" as const };
  }
  return { customer: found, field: "phone" as const };
}

export async function findCustomers(filters: CustomerListFilters) {
  const where = customerWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [total, items] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const metrics = await getCustomerListMetrics(
    filters.companyId,
    items.map((item) => item.id),
  );

  return {
    items: items.map((item) => ({
      ...item,
      metrics: metrics.get(item.id) ?? {
        salesCount: 0,
        salesTotal: 0,
        lastSaleAt: null,
        openBalance: 0,
      },
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getCustomerListMetrics(
  companyId: string,
  customerIds: string[],
) {
  const map = new Map<string, CustomerListMetrics>();
  for (const id of customerIds) {
    map.set(id, {
      salesCount: 0,
      salesTotal: 0,
      lastSaleAt: null,
      openBalance: 0,
    });
  }
  if (customerIds.length === 0) return map;

  const [sales, open] = await Promise.all([
    prisma.sale.groupBy({
      by: ["customerId"],
      where: {
        companyId,
        status: "COMPLETED",
        customerId: { in: customerIds },
      },
      _count: { _all: true },
      _sum: { total: true },
      _max: { completedAt: true },
    }),
    prisma.accountReceivable.groupBy({
      by: ["customerId"],
      where: {
        companyId,
        customerId: { in: customerIds },
        remainingAmount: { gt: 0 },
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      },
      _sum: { remainingAmount: true },
    }),
  ]);

  for (const row of sales) {
    if (!row.customerId) continue;
    const current = map.get(row.customerId);
    if (!current) continue;
    current.salesCount = row._count._all;
    current.salesTotal = Number(row._sum.total ?? 0);
    current.lastSaleAt = row._max.completedAt;
  }
  for (const row of open) {
    if (!row.customerId) continue;
    const current = map.get(row.customerId);
    if (!current) continue;
    current.openBalance = Number(row._sum.remainingAmount ?? 0);
  }
  return map;
}

export async function findCustomerById(params: {
  companyId: string;
  customerId: string;
}) {
  return prisma.customer.findFirst({
    where: {
      id: params.customerId,
      companyId: params.companyId,
      ...notDeletedFilter,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getCustomer360(params: {
  companyId: string;
  customerId: string;
  includeSales?: boolean;
  includeFinance?: boolean;
}) {
  const includeSales = params.includeSales ?? true;
  const includeFinance = params.includeFinance ?? true;
  const today = startOfToday();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  inSevenDays.setHours(23, 59, 59, 999);

  const completedWhere = {
    companyId: params.companyId,
    customerId: params.customerId,
    status: "COMPLETED" as const,
  };

  const [
    salesAgg,
    lastSale,
    topProducts,
    recentSales,
    receivedAgg,
    openAgg,
    overdueAgg,
    upcoming,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: completedWhere,
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.sale.findFirst({
      where: completedWhere,
      orderBy: { completedAt: "desc" },
      select: { id: true, number: true, total: true, completedAt: true },
    }),
    prisma.$queryRaw<
      Array<{
        productId: string;
        productName: string;
        productSku: string;
        quantity: number;
        revenue: unknown;
      }>
    >`
      SELECT si."productId" AS "productId",
             si."productName" AS "productName",
             si."productSku" AS "productSku",
             SUM(si.quantity)::int AS quantity,
             COALESCE(SUM(si."lineTotal"), 0) AS revenue
      FROM "SaleItem" si
      INNER JOIN "Sale" s ON s.id = si."saleId"
      WHERE s."companyId" = ${params.companyId}
        AND si."companyId" = ${params.companyId}
        AND s."customerId" = ${params.customerId}
        AND s.status = 'COMPLETED'
      GROUP BY si."productId", si."productName", si."productSku"
      ORDER BY SUM(si."lineTotal") DESC, SUM(si.quantity) DESC
      LIMIT 8
    `,
    prisma.sale.findMany({
      where: {
        companyId: params.companyId,
        customerId: params.customerId,
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        completedAt: true,
        cancelledAt: true,
        paymentMethod: true,
      },
    }),
    prisma.installmentPayment.aggregate({
      where: {
        companyId: params.companyId,
        installment: { accountReceivable: { customerId: params.customerId } },
      },
      _sum: { amount: true },
    }),
    prisma.accountReceivable.aggregate({
      where: {
        companyId: params.companyId,
        customerId: params.customerId,
        remainingAmount: { gt: 0 },
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      },
      _sum: { remainingAmount: true },
    }),
    prisma.installment.aggregate({
      where: {
        companyId: params.companyId,
        remainingAmount: { gt: 0 },
        status: { notIn: ["PAID", "CANCELLED"] },
        dueDate: { lt: today },
        accountReceivable: { customerId: params.customerId },
      },
      _sum: { remainingAmount: true },
      _count: { _all: true },
    }),
    prisma.installment.findMany({
      where: {
        companyId: params.companyId,
        remainingAmount: { gt: 0 },
        status: { notIn: ["PAID", "CANCELLED"] },
        dueDate: { gte: today, lte: inSevenDays },
        accountReceivable: { customerId: params.customerId },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: {
        id: true,
        number: true,
        remainingAmount: true,
        dueDate: true,
        accountReceivable: {
          select: { sale: { select: { id: true, number: true } } },
        },
      },
    }),
  ]);

  const salesCount = salesAgg._count._all;
  const salesTotal = Number(salesAgg._sum.total ?? 0);
  const ticket =
    salesCount > 0 ? fromCents(Math.round(toCents(salesTotal) / salesCount)) : 0;

  return {
    sales: includeSales
      ? {
          count: salesCount,
          total: salesTotal,
          ticket,
          lastSale,
        }
      : null,
    products: includeSales
      ? topProducts.map((row) => ({
          productId: row.productId,
          name: row.productName,
          sku: row.productSku,
          quantity: row.quantity,
          revenue: Number(row.revenue ?? 0),
        }))
      : [],
    recentSales: includeSales ? recentSales : [],
    finance: includeFinance
      ? {
          received: Number(receivedAgg._sum.amount ?? 0),
          open: Number(openAgg._sum.remainingAmount ?? 0),
          overdue: Number(overdueAgg._sum.remainingAmount ?? 0),
          overdueCount: overdueAgg._count._all,
          upcoming: upcoming.map((item) => ({
            id: item.id,
            number: item.number,
            remainingAmount: Number(item.remainingAmount),
            dueDate: item.dueDate,
            saleId: item.accountReceivable.sale.id,
            saleNumber: item.accountReceivable.sale.number,
          })),
        }
      : null,
  };
}

export async function createCustomer(params: {
  companyId: string;
  data: CustomerFormInput;
}) {
  const data = toCustomerData(params.data);
  return prisma.customer.create({
    data: {
      ...data,
      companyId: params.companyId,
    },
  });
}

export async function updateCustomer(params: {
  companyId: string;
  customerId: string;
  data: CustomerFormInput;
}) {
  const existing = await findCustomerById({
    companyId: params.companyId,
    customerId: params.customerId,
  });
  if (!existing) {
    return null;
  }

  const data = toCustomerData(params.data);
  const { companyId, ...updateData } = data;
  void companyId;

  return prisma.customer.update({
    where: { id: existing.id },
    data: updateData,
  });
}

export async function softDeleteCustomer(params: {
  companyId: string;
  customerId: string;
}) {
  const existing = await findCustomerById({
    companyId: params.companyId,
    customerId: params.customerId,
  });
  if (!existing) {
    return null;
  }

  return prisma.customer.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}

export async function listCustomerOrigins(companyId: string) {
  const rows = await prisma.customer.findMany({
    where: {
      companyId,
      ...notDeletedFilter,
      origin: { not: null },
    },
    distinct: ["origin"],
    select: { origin: true },
    orderBy: { origin: "asc" },
  });
  return rows
    .map((row) => row.origin)
    .filter((origin): origin is string => Boolean(origin));
}

export async function listCompanyOwners(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId, ...notDeletedFilter },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
