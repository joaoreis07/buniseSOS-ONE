export const TEMPLATE_VARIABLES = [
  "customer.name",
  "customer.phone",
  "customer.whatsapp",
  "customer.email",
  "sale.number",
  "sale.total",
  "sale.date",
  "finance.remaining",
  "installment.number",
  "installment.dueDate",
  "installment.remaining",
  "installment.amount",
  "company.name",
  "company.phone",
  "company.whatsapp",
  "company.email",
  "company.signature",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Partial<Record<TemplateVariable, string>>;

const VARIABLE_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const ALLOWED = new Set<string>(TEMPLATE_VARIABLES);

export function extractTemplateVariables(source: string): string[] {
  const found = new Set<string>();
  const text = source ?? "";
  for (const match of text.matchAll(VARIABLE_RE)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}

export function unknownTemplateVariables(source: string): string[] {
  return extractTemplateVariables(source).filter((name) => !ALLOWED.has(name));
}

export function validateTemplateSource(source: string): {
  ok: boolean;
  unknown: string[];
} {
  const unknown = unknownTemplateVariables(source);
  return { ok: unknown.length === 0, unknown };
}

export function renderTemplate(
  source: string,
  values: TemplateValues,
): {
  text: string;
  unknown: string[];
  missing: string[];
} {
  const unknown = unknownTemplateVariables(source);
  const used = extractTemplateVariables(source).filter((name) => ALLOWED.has(name));
  const missing = used.filter((name) => {
    const value = values[name as TemplateVariable];
    return value == null || String(value).trim().length === 0;
  });

  const text = (source ?? "").replace(VARIABLE_RE, (_full, name: string) => {
    if (!ALLOWED.has(name)) return `{{${name}}}`;
    const value = values[name as TemplateVariable];
    if (value == null || String(value).trim().length === 0) return "—";
    return String(value);
  });

  return { text, unknown, missing };
}

export function assertTemplatePublishable(source: string) {
  const { ok, unknown } = validateTemplateSource(source);
  if (!ok) {
    throw new Error(
      `Variável inválida no template: ${unknown.map((name) => `{{${name}}}`).join(", ")}`,
    );
  }
}
