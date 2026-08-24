export const LEAD_ORIGIN_LABELS = {
  WEBSITE: "Website",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Indicação",
  ECOMMERCE: "E-commerce",
  OTHER: "Outro",
} as const;

export const LEAD_STATUS_LABELS = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  UNQUALIFIED: "Não qualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
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
