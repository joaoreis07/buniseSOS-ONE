export const PRODUCT_TYPE_LABELS = {
  PRODUCT: "Produto",
  SERVICE: "Serviço",
} as const;

export const PRODUCT_STATUS_LABELS = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
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

export function toMoneyInputValue(value: unknown): string {
  if (value == null || value === "") return "0";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "0";
  return amount.toFixed(2);
}
