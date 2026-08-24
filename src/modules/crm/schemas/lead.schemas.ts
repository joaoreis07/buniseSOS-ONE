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

const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().email("E-mail inválido").nullable(),
);

export const leadOriginSchema = z.enum([
  "WEBSITE",
  "INSTAGRAM",
  "FACEBOOK",
  "WHATSAPP",
  "REFERRAL",
  "ECOMMERCE",
  "OTHER",
]);

export const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
  "LOST",
]);

const estimatedValueSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().nonnegative("Valor estimado inválido").nullable());

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  companyName: optionalText(160, "Empresa"),
  email: optionalEmail,
  phone: optionalText(40, "Telefone"),
  whatsapp: optionalText(40, "WhatsApp"),
  origin: leadOriginSchema.default("OTHER"),
  status: leadStatusSchema.default("NEW"),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  estimatedValue: estimatedValueSchema,
  notes: optionalText(4000, "Observações"),
});

export const leadListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(emptyToNull, leadStatusSchema.nullable()).optional(),
  origin: z.preprocess(emptyToNull, leadOriginSchema.nullable()).optional(),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  createdFrom: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  createdTo: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
