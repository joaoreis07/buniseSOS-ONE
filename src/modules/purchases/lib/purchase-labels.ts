export const SUPPLIER_STATUS_LABELS = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
} as const;

export const PURCHASE_STATUS_LABELS = {
  DRAFT: "Rascunho",
  RECEIVED: "Recebida",
  CANCELLED: "Cancelada",
} as const;

export function formatPurchaseNumber(number: number): string {
  return `C-${String(number).padStart(5, "0")}`;
}
