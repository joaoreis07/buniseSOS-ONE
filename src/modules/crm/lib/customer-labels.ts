export const CUSTOMER_STATUS_LABELS = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
} as const;

export const CUSTOMER_TYPE_LABELS = {
  INDIVIDUAL: "Pessoa física",
  COMPANY: "Pessoa jurídica",
} as const;

export function formatDocument(document: string | null | undefined): string {
  if (!document) return "—";
  const digits = document.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }
  return document;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  return value;
}
