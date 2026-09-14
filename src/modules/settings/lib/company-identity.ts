export function formatAddress(parts: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}) {
  const line1 = [parts.street, parts.number, parts.complement]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
  const line2 = [parts.district, parts.city, parts.state]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(" · ");
  const zip = parts.zipCode?.trim() ? `CEP ${parts.zipCode.trim()}` : "";
  return [line1, line2, zip].filter(Boolean).join("\n");
}

export function buildCompanySignature(params: {
  displayName?: string | null;
  name: string;
  configured?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const configured = params.configured?.trim();
  if (configured) return configured;
  const company = params.displayName?.trim() || params.name;
  const lines = ["Atenciosamente,", company];
  if (params.whatsapp?.trim()) lines.push(`WhatsApp: ${params.whatsapp.trim()}`);
  if (params.phone?.trim()) lines.push(`Telefone: ${params.phone.trim()}`);
  if (params.email?.trim()) lines.push(params.email.trim());
  return lines.join("\n");
}

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const text = value?.trim().toLowerCase() ?? "";
  return /^#[0-9a-f]{6}$/.test(text) ? text : fallback;
}
