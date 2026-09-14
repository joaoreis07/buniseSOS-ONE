import type { OperationalDocumentKind } from "@prisma/client";

export const DOCUMENT_KIND_LABELS: Record<OperationalDocumentKind, string> = {
  SALE_RECEIPT: "Recibo de venda",
  PAYMENT_RECEIPT: "Comprovante de pagamento",
  PURCHASE_RECORD: "Documento de compra",
};

export const DOCUMENT_KIND_PREFIX: Record<OperationalDocumentKind, string> = {
  SALE_RECEIPT: "RV",
  PAYMENT_RECEIPT: "CP",
  PURCHASE_RECORD: "DC",
};

export function formatOperationalDocumentNumber(
  kind: OperationalDocumentKind,
  number: number,
) {
  return `${DOCUMENT_KIND_PREFIX[kind]}-${String(number).padStart(5, "0")}`;
}

export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value) || normalized.length !== 6) {
    return { r: 4, g: 120, b: 87 };
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
