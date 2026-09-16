import { Prisma, type InstallmentPeriod, type Role } from "@prisma/client";
import { hasPermission, assertPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { fromCents, splitCents, toCents } from "@/modules/finance/lib/money";
import {
  buildDueDates,
  defaultDueDate,
  isOverdue,
  parseCivilDate,
} from "@/modules/finance/lib/schedule";
import {
  findReceivableById,
  findReceivables,
  getFinanceKpis,
  listFinanceCustomers,
} from "@/modules/finance/repositories/finance.repository";
import type {
  FinanceListQuery,
  ReceivePaymentInput,
} from "@/modules/finance/schemas/finance.schemas";
import { notifyPaymentReceived } from "@/modules/communications/services/notification.service";

type CreateReceivableParams = {
  companyId: string;
  userId: string;
  sale: {
    id: string;
    customerId: string | null;
    total: unknown;
    paymentMethod:
      | "CASH"
      | "PIX"
      | "CARD"
      | "CARD_CREDIT"
      | "CARD_DEBIT"
      | "TED"
      | "OTHER";
  };
  paymentMode: "CASH" | "INSTALLMENT";
  installmentsCount: number;
  firstDueDate?: string | null;
  period: InstallmentPeriod;
};

function statusForInstallment(params: {
  amountCents: number;
  paidCents: number;
  dueDate: Date;
}) {
  if (params.paidCents >= params.amountCents) return "PAID" as const;
  if (isOverdue(params.dueDate) && params.paidCents < params.amountCents) {
    return "OVERDUE" as const;
  }
  if (params.paidCents > 0) return "PARTIAL" as const;
  return "PENDING" as const;
}

function statusForAccount(
  installments: Array<{ amount: unknown; paidAmount: unknown; status: string }>,
) {
  if (
    installments.length &&
    installments.every((item) => item.status === "CANCELLED")
  ) {
    return "CANCELLED" as const;
  }
  const total = installments.reduce((sum, item) => sum + toCents(item.amount), 0);
  const paid = installments.reduce(
    (sum, item) => sum + toCents(item.paidAmount),
    0,
  );
  if (total > 0 && paid === total) return "PAID" as const;
  if (installments.some((item) => item.status === "OVERDUE")) {
    return "OVERDUE" as const;
  }
  return paid > 0 ? ("PARTIAL" as const) : ("PENDING" as const);
}

export function canViewFinance(role: Role) {
  return hasPermission(role, "finance:view");
}

export function canReceiveFinance(role: Role) {
  return (
    hasPermission(role, "finance:receive") ||
    hasPermission(role, "finance:manage")
  );
}

export async function createReceivableForSale(
  tx: Prisma.TransactionClient,
  params: CreateReceivableParams,
) {
  const existing = await tx.accountReceivable.findUnique({
    where: { saleId: params.sale.id },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Esta venda já possui conta a receber");
  }

  const totalCents = toCents(params.sale.total);
  const count =
    params.paymentMode === "CASH" ? 1 : params.installmentsCount;
  const firstDueDate =
    params.paymentMode === "CASH"
      ? defaultDueDate()
      : params.firstDueDate
        ? parseCivilDate(params.firstDueDate)
        : null;
  if (!firstDueDate) {
    throw new Error("Informe o primeiro vencimento para venda parcelada");
  }

  const amounts = splitCents(totalCents, count);
  const dueDates = buildDueDates({
    firstDueDate,
    count,
    period: params.period,
  });
  const paidImmediately = params.paymentMode === "CASH";

  try {
    return await tx.accountReceivable.create({
      data: {
        companyId: params.companyId,
        saleId: params.sale.id,
        customerId: params.sale.customerId,
        paymentMethod: params.sale.paymentMethod,
        paymentMode: params.paymentMode,
        totalAmount: fromCents(totalCents),
        paidAmount: paidImmediately ? fromCents(totalCents) : 0,
        remainingAmount: paidImmediately ? 0 : fromCents(totalCents),
        status: paidImmediately ? "PAID" : "PENDING",
        dueDate: dueDates.at(-1) ?? firstDueDate,
        installments: {
          create: amounts.map((amountCents, index) => ({
            companyId: params.companyId,
            number: index + 1,
            amount: fromCents(amountCents),
            paidAmount: paidImmediately ? fromCents(amountCents) : 0,
            remainingAmount: paidImmediately ? 0 : fromCents(amountCents),
            dueDate: dueDates[index],
            status: paidImmediately
              ? "PAID"
              : statusForInstallment({
                  amountCents,
                  paidCents: 0,
                  dueDate: dueDates[index],
                }),
            payments: paidImmediately
              ? {
                  create: {
                    companyId: params.companyId,
                    amount: fromCents(amountCents),
                    paymentMethod: params.sale.paymentMethod,
                    paidById: params.userId,
                  },
                }
              : undefined,
          })),
        },
      },
      include: { installments: { select: { id: true, number: true } } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Esta venda já possui conta a receber");
    }
    throw error;
  }
}

export async function refreshFinanceStatuses(companyId: string) {
  const overdueBefore = new Date();
  overdueBefore.setHours(0, 0, 0, 0);
  await prisma.installment.updateMany({
    where: {
      companyId,
      status: { in: ["PENDING", "PARTIAL"] },
      remainingAmount: { gt: 0 },
      dueDate: { lt: overdueBefore },
    },
    data: { status: "OVERDUE" },
  });
  const openAccounts = await prisma.accountReceivable.findMany({
    where: {
      companyId,
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    },
    select: {
      id: true,
      status: true,
      installments: { select: { amount: true, paidAmount: true, status: true } },
    },
  });
  await Promise.all(
    openAccounts.map((account) => {
      const nextStatus = statusForAccount(account.installments);
      if (nextStatus === account.status) return Promise.resolve();
      return prisma.accountReceivable.update({
        where: { id: account.id },
        data: { status: nextStatus },
      });
    }),
  );
}

export async function listFinanceForTenant(params: {
  companyId: string;
  role: Role;
  query: FinanceListQuery;
}) {
  assertPermission(params.role, "finance:view");
  await refreshFinanceStatuses(params.companyId);
  const [result, kpis, customers] = await Promise.all([
    findReceivables({ companyId: params.companyId, ...params.query }),
    getFinanceKpis(params.companyId),
    listFinanceCustomers(params.companyId),
  ]);
  return { ...result, kpis, customers };
}

export async function getReceivableForTenant(params: {
  companyId: string;
  role: Role;
  id: string;
}) {
  assertPermission(params.role, "finance:view");
  await refreshFinanceStatuses(params.companyId);
  return findReceivableById({ companyId: params.companyId, id: params.id });
}

export async function receiveInstallmentPayment(params: {
  companyId: string;
  userId: string;
  role: Role;
  data: ReceivePaymentInput;
}) {
  if (!canReceiveFinance(params.role)) {
    throw new Error("Você não tem permissão para receber pagamentos");
  }

  const payment = await prisma.$transaction(async (tx) => {
    const found = await tx.installment.findFirst({
      where: {
        id: params.data.installmentId,
        companyId: params.companyId,
      },
      select: { id: true, accountReceivableId: true },
    });
    if (!found) throw new Error("Parcela não encontrada");

    await tx.$queryRaw`
      SELECT id FROM "AccountReceivable"
      WHERE id = ${found.accountReceivableId}
        AND "companyId" = ${params.companyId}
      FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT id FROM "Installment"
      WHERE id = ${found.id}
        AND "companyId" = ${params.companyId}
      FOR UPDATE
    `;

    const installment = await tx.installment.findFirst({
      where: { id: found.id, companyId: params.companyId },
      include: { accountReceivable: true },
    });
    if (!installment) throw new Error("Parcela não encontrada");
    if (
      installment.status === "CANCELLED" ||
      installment.accountReceivable.status === "CANCELLED"
    ) {
      throw new Error("Não é possível receber uma conta cancelada");
    }

    const amountCents = toCents(params.data.amount);
    const remainingCents = toCents(installment.remainingAmount);
    if (amountCents > remainingCents) {
      throw new Error("Pagamento superior ao saldo da parcela");
    }

    const paidCents = toCents(installment.paidAmount) + amountCents;
    const nextRemaining = remainingCents - amountCents;
    const amountTotalCents = toCents(installment.amount);
    if (paidCents + nextRemaining !== amountTotalCents) {
      throw new Error("Invariante monetária da parcela violada");
    }

    const nextStatus = statusForInstallment({
      amountCents: amountTotalCents,
      paidCents,
      dueDate: installment.dueDate,
    });

    const created = await tx.installmentPayment.create({
      data: {
        companyId: params.companyId,
        installmentId: installment.id,
        amount: fromCents(amountCents),
        paymentMethod: params.data.paymentMethod,
        notes: params.data.notes,
        paidById: params.userId,
      },
    });

    await tx.installment.update({
      where: { id: installment.id },
      data: {
        paidAmount: fromCents(paidCents),
        remainingAmount: fromCents(nextRemaining),
        status: nextStatus,
      },
    });

    const refreshed = await tx.installment.findMany({
      where: { accountReceivableId: installment.accountReceivableId },
      select: { amount: true, paidAmount: true, status: true },
    });
    const accountPaid = refreshed.reduce(
      (sum, item) => sum + toCents(item.paidAmount),
      0,
    );
    const accountTotal = toCents(installment.accountReceivable.totalAmount);
    const paymentsSum = await tx.installmentPayment.aggregate({
      where: {
        installment: { accountReceivableId: installment.accountReceivableId },
      },
      _sum: { amount: true },
    });
    if (toCents(paymentsSum._sum.amount ?? 0) !== accountPaid) {
      throw new Error("Histórico de pagamentos inconsistente com o valor pago");
    }
    if (accountPaid + (accountTotal - accountPaid) !== accountTotal) {
      throw new Error("Invariante monetária da conta violada");
    }

    const accountStatus = statusForAccount(refreshed);
    await tx.accountReceivable.update({
      where: { id: installment.accountReceivableId },
      data: {
        paidAmount: fromCents(accountPaid),
        remainingAmount: fromCents(accountTotal - accountPaid),
        status: accountStatus,
      },
    });

    return {
      payment: created,
      installmentId: installment.id,
      receivableId: installment.accountReceivableId,
      installmentStatus: nextStatus,
      accountStatus,
    };
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "finance",
    action:
      payment.installmentStatus === "PAID"
        ? "INSTALLMENT_PAID"
        : "PAYMENT_PARTIAL",
    entity: "Installment",
    entityId: payment.installmentId,
    metadata: {
      paymentId: payment.payment.id,
      amount: params.data.amount,
      receivableId: payment.receivableId,
    },
  });
  if (payment.accountStatus === "PAID") {
    await writeAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      module: "finance",
      action: "ACCOUNT_RECEIVABLE_PAID",
      entity: "AccountReceivable",
      entityId: payment.receivableId,
    });
  }

  await notifyPaymentReceived({
    companyId: params.companyId,
    actorUserId: params.userId,
    paymentId: payment.payment.id,
    receivableId: payment.receivableId,
    amount: params.data.amount,
  }).catch(() => undefined);

  return payment;
}

export async function cancelReceivableForSale(
  tx: Prisma.TransactionClient,
  params: { companyId: string; saleId: string },
) {
  const account = await tx.accountReceivable.findFirst({
    where: { companyId: params.companyId, saleId: params.saleId },
    select: { id: true },
  });
  if (!account) return null;

  await tx.installment.updateMany({
    where: { accountReceivableId: account.id },
    data: { status: "CANCELLED" },
  });

  return tx.accountReceivable.update({
    where: { id: account.id },
    data: { status: "CANCELLED" },
  });
}
