export const ACTIVITY_TYPE_LABELS = {
  CALL: "Ligação",
  MEETING: "Reunião",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  TASK: "Tarefa",
  NOTE: "Nota",
} as const;

export const ACTIVITY_STATUS_LABELS = {
  PENDING: "Pendente",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} as const;

export function toDateTimeLocalValue(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTimeBR(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}
