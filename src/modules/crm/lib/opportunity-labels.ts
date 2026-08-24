export const OPPORTUNITY_STAGE_LABELS = {
  NEW: "Nova",
  QUALIFIED: "Qualificada",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação",
  WON: "Ganha",
  LOST: "Perdida",
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

export function formatDateBR(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

export function toDateInputValue(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
