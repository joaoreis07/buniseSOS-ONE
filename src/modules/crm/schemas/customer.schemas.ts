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

const optionalEmail = z.preprocess(emptyToNull, z.string().email("E-mail inválido").nullable());

const documentSchema = z.preprocess(emptyToNull, z.string().nullable()).superRefine((value, ctx) => {
  if (!value) return;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 14) {
    ctx.addIssue({
      code: "custom",
      message: "CPF/CNPJ deve ter 11 ou 14 dígitos",
    });
  }
});

export const customerTypeSchema = z.enum(["INDIVIDUAL", "COMPANY"]);
export const customerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);

export const customerFormSchema = z.object({
  type: customerTypeSchema.default("INDIVIDUAL"),
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  tradeName: optionalText(160, "Nome fantasia"),
  document: documentSchema,
  email: optionalEmail,
  phone: optionalText(40, "Telefone"),
  mobile: optionalText(40, "Celular"),
  whatsapp: optionalText(40, "WhatsApp"),
  zipCode: optionalText(20, "CEP"),
  street: optionalText(160, "Rua"),
  number: optionalText(30, "Número"),
  complement: optionalText(120, "Complemento"),
  district: optionalText(120, "Bairro"),
  city: optionalText(120, "Cidade"),
  state: optionalText(2, "UF"),
  country: z.preprocess(emptyToNull, z.string().max(2).nullable()).transform((v) => v ?? "BR"),
  status: customerStatusSchema.default("ACTIVE"),
  origin: optionalText(80, "Origem"),
  notes: optionalText(4000, "Observações"),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
});

export const customerListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(
    emptyToNull,
    customerStatusSchema.nullable(),
  ).optional(),
  origin: z.preprocess(emptyToNull, z.string().max(80).nullable()).optional(),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  createdFrom: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  createdTo: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
