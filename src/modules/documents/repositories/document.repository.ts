import type { OperationalDocumentKind } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import {
  isUniqueViolation,
  nextOperationalDocumentNumber,
} from "@/modules/documents/lib/document-sequence";

export async function findOperationalDocument(params: {
  companyId: string;
  kind: OperationalDocumentKind;
  saleId?: string | null;
  purchaseId?: string | null;
  installmentPaymentId?: string | null;
}) {
  return prisma.operationalDocument.findFirst({
    where: {
      companyId: params.companyId,
      kind: params.kind,
      ...(params.saleId ? { saleId: params.saleId } : {}),
      ...(params.purchaseId ? { purchaseId: params.purchaseId } : {}),
      ...(params.installmentPaymentId
        ? { installmentPaymentId: params.installmentPaymentId }
        : {}),
    },
  });
}

export async function issueOperationalDocument(params: {
  companyId: string;
  userId: string;
  kind: OperationalDocumentKind;
  saleId?: string | null;
  purchaseId?: string | null;
  installmentPaymentId?: string | null;
}) {
  const existing = await findOperationalDocument(params);
  if (existing) return { document: existing, created: false };

  try {
    const document = await prisma.$transaction(async (tx) => {
      const number = await nextOperationalDocumentNumber(
        tx,
        params.companyId,
        params.kind,
      );
      return tx.operationalDocument.create({
        data: {
          companyId: params.companyId,
          kind: params.kind,
          number,
          saleId: params.saleId ?? null,
          purchaseId: params.purchaseId ?? null,
          installmentPaymentId: params.installmentPaymentId ?? null,
          createdById: params.userId,
        },
      });
    });
    return { document, created: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const raced = await findOperationalDocument(params);
    if (!raced) throw error;
    return { document: raced, created: false };
  }
}

export async function findInstallmentPaymentForTenant(params: {
  companyId: string;
  paymentId: string;
}) {
  return prisma.installmentPayment.findFirst({
    where: { id: params.paymentId, companyId: params.companyId },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      installment: {
        include: {
          accountReceivable: {
            include: {
              customer: { select: { id: true, name: true } },
              sale: { select: { id: true, number: true, notes: true } },
            },
          },
        },
      },
    },
  });
}
