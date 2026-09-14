import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type { FinanceListQuery } from "@/modules/finance/schemas/finance.schemas";

const receivableInclude = {
  sale: { select: { id: true, number: true, status: true, total: true } },
  customer: { select: { id: true, name: true } },
  installments: {
    orderBy: { number: "asc" as const },
    include: {
      payments: {
        orderBy: { paidAt: "desc" as const },
        include: { paidBy: { select: { name: true, email: true } } },
      },
    },
  },
};

export async function findReceivableById(params: { companyId: string; id: string }) {
  return prisma.accountReceivable.findFirst({
    where: { id: params.id, companyId: params.companyId },
    include: receivableInclude,
  });
}

export async function findReceivables(params: FinanceListQuery & { companyId: string }) {
  const where: Prisma.AccountReceivableWhereInput = { companyId: params.companyId };
  if (params.status) where.status = params.status;
  if (params.customerId) where.customerId = params.customerId;
  if (params.q?.trim()) {
    const q = params.q.trim();
    const number = Number.parseInt(q.replace(/\D/g, ""), 10);
    where.OR = [
      { customer: { name: { contains: q, mode: "insensitive" } } },
      ...(Number.isFinite(number) ? [{ sale: { number } }] : []),
    ];
  }
  const skip = (params.page - 1) * params.pageSize;
  const [total, items] = await Promise.all([
    prisma.accountReceivable.count({ where }),
    prisma.accountReceivable.findMany({
      where,
      include: { sale: { select: { id: true, number: true, status: true } }, customer: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: params.pageSize,
    }),
  ]);
  return { items, total, page: params.page, pageSize: params.pageSize, pageCount: Math.max(1, Math.ceil(total / params.pageSize)) };
}

export async function getFinanceKpis(companyId: string) {
  const [open, overdue, paid] = await Promise.all([
    prisma.accountReceivable.aggregate({ where: { companyId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }, _sum: { remainingAmount: true } }),
    prisma.accountReceivable.aggregate({ where: { companyId, status: "OVERDUE" }, _sum: { remainingAmount: true } }),
    prisma.accountReceivable.aggregate({ where: { companyId, status: "PAID" }, _sum: { paidAmount: true } }),
  ]);
  return { openAmount: open._sum.remainingAmount ?? 0, overdueAmount: overdue._sum.remainingAmount ?? 0, receivedAmount: paid._sum.paidAmount ?? 0 };
}

export async function listFinanceCustomers(companyId: string) {
  return prisma.customer.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}
