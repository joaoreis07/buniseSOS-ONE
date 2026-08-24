export const SALE_STATUS_LABELS = {
  DRAFT: "Rascunho",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} as const;

export const PAYMENT_METHOD_LABELS = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CARD: "Cartão",
  CARD_CREDIT: "Cartão de crédito",
  CARD_DEBIT: "Cartão de débito",
  TED: "TED",
  OTHER: "Outro",
} as const;

export function formatMoneyBRL(value: unknown): string {
  if (value == null || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDateTimeBR(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}
