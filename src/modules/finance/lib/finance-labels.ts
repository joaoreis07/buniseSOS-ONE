export const RECEIVABLE_STATUS_LABELS = {
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  PAID: "Quitada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
} as const;

export function formatDateBR(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}
