export const INVENTORY_MOVEMENT_LABELS = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  ADJUSTMENT: "Ajuste",
  RETURN: "Devolução",
  LOSS: "Perda",
} as const;

export type StockLevel = "normal" | "low" | "out";

export function getStockLevel(params: {
  quantity: number;
  minimumQuantity: number;
}): StockLevel {
  if (params.quantity <= 0) return "out";
  if (
    params.minimumQuantity > 0 &&
    params.quantity <= params.minimumQuantity
  ) {
    return "low";
  }
  return "normal";
}

export const STOCK_LEVEL_LABELS: Record<StockLevel, string> = {
  normal: "Normal",
  low: "Estoque baixo",
  out: "Sem estoque",
};

export function formatMoneyBRL(value: unknown): string {
  if (value == null || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDateTimeBR(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}
