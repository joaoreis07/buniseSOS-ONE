import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
};

const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyToNull,
    z.string().max(max, `${label} muito longo`).nullable(),
  );

export const companyProfileSchema = z.object({
  name: z
    .string({ message: "Informe o nome da empresa" })
    .trim()
    .min(2, "Nome da empresa muito curto")
    .max(120, "Nome da empresa muito longo"),
  tradeName: optionalText(120, "Nome fantasia"),
  document: optionalText(32, "Documento"),
  email: z.preprocess(emptyToNull, z.string().email("E-mail inválido").max(180).nullable()),
  phone: optionalText(32, "Telefone"),
  whatsapp: optionalText(32, "WhatsApp"),
  website: optionalText(180, "Site"),
  description: optionalText(2000, "Descrição"),
  zipCode: optionalText(16, "CEP"),
  street: optionalText(180, "Endereço"),
  number: optionalText(32, "Número"),
  complement: optionalText(120, "Complemento"),
  district: optionalText(120, "Bairro"),
  city: optionalText(120, "Cidade"),
  state: optionalText(2, "Estado"),
});

export const preferencesSchema = z.object({
  language: z.enum(["pt-BR"]),
  currency: z.enum(["BRL"]),
  timezone: z.enum(["America/Sao_Paulo"]),
  dateFormat: z.enum(["dd/MM/yyyy"]),
  theme: z.enum(["light"]),
});

export const brandingSchema = z.object({
  displayName: optionalText(120, "Nome exibido"),
  primaryColor: z.preprocess(
    (value) => emptyToNull(value) ?? "#047857",
    z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor principal inválida"),
  ),
  secondaryColor: z.preprocess(
    (value) => emptyToNull(value) ?? "#0f172a",
    z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor secundária inválida"),
  ),
});

export const documentSettingsSchema = z.object({
  documentTitle: optionalText(80, "Título do documento"),
  documentHeader: optionalText(500, "Cabeçalho"),
  documentFooter: optionalText(500, "Rodapé"),
  communicationSignature: optionalText(1000, "Assinatura"),
  defaultSaleNotes: optionalText(4000, "Observação padrão de venda"),
  defaultPurchaseNotes: optionalText(4000, "Observação padrão de compra"),
  defaultReceiptNotes: optionalText(4000, "Texto padrão de recibo"),
  allowSaleWithoutCustomer: z.preprocess((value) => {
    if (value === true || value === "true" || value === "on" || value === "1") return true;
    if (value === false || value === "false" || value === "off" || value === "0" || value == null) {
      return false;
    }
    return value;
  }, z.boolean()),
  defaultInstallmentCount: z.coerce.number().int().min(1).max(24),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
export type DocumentSettingsInput = z.infer<typeof documentSettingsSchema>;
