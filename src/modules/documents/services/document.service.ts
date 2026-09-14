import type { Role } from "@prisma/client";
import { assertPermission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { prisma } from "@/shared/db/prisma";
import { readCompanyLogo } from "@/shared/storage/tenant-files";
import { findSaleById } from "@/modules/sales/repositories/sale.repository";
import { findPurchaseById } from "@/modules/purchases/repositories/purchase.repository";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatDateTimeBR,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  formatPurchaseNumber,
  PURCHASE_STATUS_LABELS,
} from "@/modules/purchases/lib/purchase-labels";
import {
  buildCompanySignature,
  formatAddress,
  normalizeHexColor,
} from "@/modules/settings/lib/company-identity";
import { findCompanySettings } from "@/modules/settings/repositories/settings.repository";
import {
  findInstallmentPaymentForTenant,
  issueOperationalDocument,
} from "@/modules/documents/repositories/document.repository";
import { DOCUMENT_KIND_LABELS } from "@/modules/documents/lib/document-labels";
import { renderOperationalDocumentPdf } from "@/modules/documents/lib/document-pdf";
import type { OperationalDocumentView } from "@/modules/documents/lib/document-view";

async function loadCompanyContext(companyId: string) {
  const [company, settings] = await Promise.all([
    prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    }),
    findCompanySettings(companyId),
  ]);
  if (!company) throw new Error("Empresa não encontrada");
  const displayName = settings.displayName?.trim() || company.name;
  return {
    company,
    settings,
    branding: {
      primaryColor: normalizeHexColor(settings.primaryColor, "#047857"),
      secondaryColor: normalizeHexColor(settings.secondaryColor, "#0f172a"),
      documentTitle: settings.documentTitle,
      documentHeader: settings.documentHeader,
      documentFooter: settings.documentFooter,
      signature: buildCompanySignature({
        name: company.name,
        displayName: settings.displayName,
        configured: settings.communicationSignature,
        whatsapp: company.whatsapp,
        phone: company.phone,
        email: company.email,
      }),
      hasLogo: Boolean(settings.logoPath),
    },
    identity: {
      displayName,
      document: company.document,
      email: company.email,
      phone: company.phone,
      whatsapp: company.whatsapp,
      website: company.website,
      address: formatAddress(company),
    },
  };
}

async function maybeReadLogo(companyId: string, logoPath: string | null) {
  if (!logoPath) return null;
  try {
    return await readCompanyLogo({ companyId, relativePath: logoPath });
  } catch {
    return null;
  }
}

export async function getSaleReceiptView(params: {
  companyId: string;
  userId: string;
  role: Role;
  saleId: string;
}): Promise<OperationalDocumentView> {
  assertPermission(params.role, "sales:view");
  const sale = await findSaleById({
    companyId: params.companyId,
    saleId: params.saleId,
  });
  if (!sale) throw new Error("Venda não encontrada");
  if (!sale.completedAt) {
    throw new Error("Só é possível emitir recibo de venda concluída");
  }

  const issued = await issueOperationalDocument({
    companyId: params.companyId,
    userId: params.userId,
    kind: "SALE_RECEIPT",
    saleId: sale.id,
  });
  if (issued.created) {
    await writeAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      module: "documents",
      action: "RECEIPT_GENERATED",
      entity: "OperationalDocument",
      entityId: issued.document.id,
      metadata: { kind: "SALE_RECEIPT", saleId: sale.id, number: issued.document.number },
    });
  }

  const ctx = await loadCompanyContext(params.companyId);
  const notes = [sale.notes, ctx.settings.defaultReceiptNotes]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    document: issued.document,
    issuedAtLabel: formatDateTimeBR(issued.document.createdAt),
    company: ctx.identity,
    branding: {
      ...ctx.branding,
      documentTitle:
        ctx.branding.documentTitle || DOCUMENT_KIND_LABELS.SALE_RECEIPT,
    },
    fields: [
      { label: "Venda", value: formatSaleNumber(sale.number) },
      { label: "Status", value: SALE_STATUS_LABELS[sale.status] },
      { label: "Cliente", value: sale.customer?.name ?? "Consumidor não identificado" },
      { label: "Data", value: formatDateTimeBR(sale.completedAt) },
      { label: "Pagamento", value: PAYMENT_METHOD_LABELS[sale.paymentMethod] },
      {
        label: "Responsável",
        value: sale.seller?.name ?? sale.seller?.email ?? "—",
      },
      { label: "Referência", value: sale.id },
    ],
    lines: sale.items.map((item) => ({
      description: `${item.productName} (${item.productSku})`,
      quantity: String(item.quantity),
      total: formatMoneyBRL(item.lineTotal),
    })),
    totals: [
      { label: "Subtotal", value: formatMoneyBRL(sale.subtotal) },
      { label: "Desconto", value: formatMoneyBRL(sale.discountAmount) },
      { label: "Total", value: formatMoneyBRL(sale.total), emphasize: true },
    ],
    notes: notes || null,
    backHref: `/app/sales/${sale.id}`,
    pdfHref: `/app/documents/sale/${sale.id}/pdf`,
  };
}

export async function getPaymentReceiptView(params: {
  companyId: string;
  userId: string;
  role: Role;
  paymentId: string;
}): Promise<OperationalDocumentView> {
  assertPermission(params.role, "finance:view");
  const payment = await findInstallmentPaymentForTenant({
    companyId: params.companyId,
    paymentId: params.paymentId,
  });
  if (!payment) throw new Error("Pagamento não encontrado");

  const issued = await issueOperationalDocument({
    companyId: params.companyId,
    userId: params.userId,
    kind: "PAYMENT_RECEIPT",
    installmentPaymentId: payment.id,
  });
  if (issued.created) {
    await writeAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      module: "documents",
      action: "RECEIPT_GENERATED",
      entity: "OperationalDocument",
      entityId: issued.document.id,
      metadata: {
        kind: "PAYMENT_RECEIPT",
        installmentPaymentId: payment.id,
        number: issued.document.number,
      },
    });
  }

  const receivable = payment.installment.accountReceivable;
  const ctx = await loadCompanyContext(params.companyId);
  const notes = [payment.notes, ctx.settings.defaultReceiptNotes]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    document: issued.document,
    issuedAtLabel: formatDateTimeBR(issued.document.createdAt),
    company: ctx.identity,
    branding: {
      ...ctx.branding,
      documentTitle:
        ctx.branding.documentTitle || DOCUMENT_KIND_LABELS.PAYMENT_RECEIPT,
    },
    fields: [
      {
        label: "Venda",
        value: formatSaleNumber(receivable.sale.number),
      },
      {
        label: "Cliente",
        value: receivable.customer?.name ?? "Consumidor não identificado",
      },
      {
        label: "Parcela",
        value: String(payment.installment.number),
      },
      { label: "Valor", value: formatMoneyBRL(payment.amount) },
      { label: "Data", value: formatDateTimeBR(payment.paidAt) },
      {
        label: "Forma de pagamento",
        value: PAYMENT_METHOD_LABELS[payment.paymentMethod],
      },
      {
        label: "Responsável",
        value: payment.paidBy?.name ?? payment.paidBy?.email ?? "Sistema",
      },
      { label: "Referência", value: payment.id },
    ],
    lines: [],
    totals: [{ label: "Valor pago", value: formatMoneyBRL(payment.amount), emphasize: true }],
    notes: notes || null,
    backHref: `/app/finance/${receivable.id}`,
    pdfHref: `/app/documents/payment/${payment.id}/pdf`,
  };
}

export async function getPurchaseRecordView(params: {
  companyId: string;
  userId: string;
  role: Role;
  purchaseId: string;
}): Promise<OperationalDocumentView> {
  assertPermission(params.role, "purchases:view");
  const purchase = await findPurchaseById({
    companyId: params.companyId,
    purchaseId: params.purchaseId,
  });
  if (!purchase) throw new Error("Compra não encontrada");

  const issued = await issueOperationalDocument({
    companyId: params.companyId,
    userId: params.userId,
    kind: "PURCHASE_RECORD",
    purchaseId: purchase.id,
  });
  if (issued.created) {
    await writeAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      module: "documents",
      action: "DOCUMENT_GENERATED",
      entity: "OperationalDocument",
      entityId: issued.document.id,
      metadata: {
        kind: "PURCHASE_RECORD",
        purchaseId: purchase.id,
        number: issued.document.number,
      },
    });
  }

  const ctx = await loadCompanyContext(params.companyId);
  const notes = [purchase.notes, ctx.settings.defaultPurchaseNotes]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    document: issued.document,
    issuedAtLabel: formatDateTimeBR(issued.document.createdAt),
    company: ctx.identity,
    branding: {
      ...ctx.branding,
      documentTitle:
        ctx.branding.documentTitle || DOCUMENT_KIND_LABELS.PURCHASE_RECORD,
    },
    fields: [
      { label: "Compra", value: formatPurchaseNumber(purchase.number) },
      { label: "Status", value: PURCHASE_STATUS_LABELS[purchase.status] },
      { label: "Fornecedor", value: purchase.supplier.name },
      { label: "Data", value: formatDateTimeBR(purchase.purchasedAt) },
      {
        label: "Responsável",
        value: purchase.createdBy?.name ?? purchase.createdBy?.email ?? "—",
      },
      { label: "Referência", value: purchase.id },
    ],
    lines: purchase.items.map((item) => ({
      description: `${item.productName} (${item.productSku})`,
      quantity: String(item.quantity),
      total: formatMoneyBRL(item.lineTotal),
    })),
    totals: [
      { label: "Subtotal", value: formatMoneyBRL(purchase.subtotal) },
      { label: "Desconto", value: formatMoneyBRL(purchase.discountAmount) },
      { label: "Total", value: formatMoneyBRL(purchase.total), emphasize: true },
    ],
    notes: notes || null,
    backHref: `/app/purchases/${purchase.id}`,
    pdfHref: `/app/documents/purchase/${purchase.id}/pdf`,
  };
}

export async function renderSaleReceiptPdf(params: {
  companyId: string;
  userId: string;
  role: Role;
  saleId: string;
}) {
  const view = await getSaleReceiptView(params);
  const settings = await findCompanySettings(params.companyId);
  const logo = await maybeReadLogo(params.companyId, settings.logoPath);
  return { view, bytes: await renderOperationalDocumentPdf(view, logo) };
}

export async function renderPaymentReceiptPdf(params: {
  companyId: string;
  userId: string;
  role: Role;
  paymentId: string;
}) {
  const view = await getPaymentReceiptView(params);
  const settings = await findCompanySettings(params.companyId);
  const logo = await maybeReadLogo(params.companyId, settings.logoPath);
  return { view, bytes: await renderOperationalDocumentPdf(view, logo) };
}

export async function renderPurchaseRecordPdf(params: {
  companyId: string;
  userId: string;
  role: Role;
  purchaseId: string;
}) {
  const view = await getPurchaseRecordView(params);
  const settings = await findCompanySettings(params.companyId);
  const logo = await maybeReadLogo(params.companyId, settings.logoPath);
  return { view, bytes: await renderOperationalDocumentPdf(view, logo) };
}
