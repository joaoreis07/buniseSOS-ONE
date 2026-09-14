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

const documentSchema = z
  .preprocess(emptyToNull, z.string().nullable())
  .superRefine((value, ctx) => {
    if (!value) return;
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      ctx.addIssue({
        code: "custom",
        message: "CPF/CNPJ deve ter 11 ou 14 dígitos",
      });
    }
  });

export const supplierStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const supplierFormSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  tradeName: optionalText(160, "Nome fantasia"),
  document: documentSchema,
  email: optionalEmail,
  phone: optionalText(40, "Telefone"),
  mobile: optionalText(40, "Celular"),
  zipCode: optionalText(20, "CEP"),
  street: optionalText(160, "Rua"),
  number: optionalText(30, "Número"),
  complement: optionalText(120, "Complemento"),
  district: optionalText(120, "Bairro"),
  city: optionalText(120, "Cidade"),
  state: optionalText(2, "UF"),
  country: z
    .preprocess(emptyToNull, z.string().max(2).nullable())
    .transform((value) => value ?? "BR"),
  status: supplierStatusSchema.default("ACTIVE"),
  notes: optionalText(4000, "Observações"),
});

export const supplierListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(emptyToNull, supplierStatusSchema.nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;
